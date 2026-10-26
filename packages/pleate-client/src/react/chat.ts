"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ChatEvent, ChatMessage, Conversation, Schema } from "../api.ts";
import { ApiError } from "../errors.ts";
import { useCursorList, useList } from "./list.ts";
import { keys, usePleateClient } from "./provider.tsx";

/** Conversation list (sidebar), page mode with search: `useConversations().tableProps`... */
export function useConversations(options: { pageSize?: number; archived?: boolean } = {}) {
  const client = usePleateClient();
  return useList<Conversation>((params) => client.ai.conversations({ ...params, archived: options.archived ?? false }), {
    pageSize: options.pageSize ?? 30,
    ordering: "-last_message_at",
  });
}

/** Models for <ModelPicker>, with the selected one kept in state. */
export function useModels(initial?: string) {
  const client = usePleateClient();
  const query = useQuery({ queryKey: keys.models, queryFn: client.ai.models, staleTime: Infinity });
  const [value, setValue] = useState<string | undefined>(initial);
  const current = value ?? query.data?.default ?? "";
  return {
    ...query,
    model: current,
    setModel: setValue,
    modelPickerProps: {
      models: (query.data?.models ?? []).map((m) => ({ id: m.id, name: m.name, description: m.description })),
      value: current,
      onValueChange: setValue,
    },
  };
}

/** Suggestions for <PromptSuggestions>. */
export function useSuggestions(onSelect: (prompt: string) => void) {
  const client = usePleateClient();
  const query = useQuery({ queryKey: keys.suggestions, queryFn: client.ai.suggestions, staleTime: Infinity });
  return {
    ...query,
    promptSuggestionsProps: {
      suggestions: (query.data ?? []).map((s: Schema<"Suggestion">, i) => ({
        id: s.id ?? String(i),
        title: s.title,
        description: s.description,
        prompt: s.prompt,
      })),
      onSelect: (prompt: string) => onSelect(prompt),
    },
  };
}

type Live = {
  user?: ChatMessage;
  assistant: ChatMessage;
};

/**
 * One conversation: history, streaming answer, stop and regenerate.
 * Pass `null` to start a new conversation on the first message.
 *
 *     const chat = useChat(id, { onConversation: (c) => router.replace(`/chat/${c.id}`) });
 *     <ChatThread>{chat.messages.map((m) => <Message key={m.id} role={m.role}>{m.content}</Message>)}</ChatThread>
 *     <Composer {...chat.composerProps} />
 */
export function useChat(
  conversationId: string | null,
  options: { model?: string; onConversation?: (conversation: Conversation) => void; uploadPurpose?: string } = {},
) {
  const client = usePleateClient();
  const qc = useQueryClient();
  const [id, setId] = useState(conversationId);
  const [live, setLive] = useState<Live | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => setId(conversationId), [conversationId]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const history = useCursorList<ChatMessage>(keys.messages(id ?? "new"), (p) => client.ai.messages(id as string, p), {
    pageSize: 50,
    enabled: !!id,
  });

  // Pages come newest first; each page is chronological.
  const stored = useMemo(
    () => (history.data?.pages ?? []).slice().reverse().flatMap((p) => p.results),
    [history.data],
  );

  const messages = useMemo(() => {
    if (!live) return stored;
    const ids = new Set([live.user?.id, live.assistant.id]);
    const base = stored.filter((m) => !ids.has(m.id));
    return [...base, ...(live.user ? [live.user] : []), live.assistant];
  }, [stored, live]);

  const consume = useCallback(
    async (stream: AsyncGenerator<ChatEvent>, conversation: string) => {
      setStreaming(true);
      setError(null);
      try {
        for await (const event of stream) {
          switch (event.event) {
            case "user_message":
              setLive((prev) => ({ assistant: prev?.assistant as ChatMessage, user: event.data.message }));
              break;
            case "start":
              setLive((prev) => ({ user: prev?.user, assistant: event.data.message }));
              break;
            case "delta":
              setLive((prev) =>
                prev ? { ...prev, assistant: { ...prev.assistant, content: prev.assistant.content + event.data.text } } : prev,
              );
              break;
            case "reasoning":
              setLive((prev) =>
                prev ? { ...prev, assistant: { ...prev.assistant, reasoning: prev.assistant.reasoning + event.data.text } } : prev,
              );
              break;
            case "sources":
              setLive((prev) => (prev ? { ...prev, assistant: { ...prev.assistant, sources: event.data.sources } } : prev));
              break;
            case "error":
              setError(new ApiError({ status: 502, code: event.data.code, message: event.data.message }));
              break;
            case "done":
              setLive((prev) => (prev ? { ...prev, assistant: event.data.message } : prev));
              break;
          }
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          setError(err instanceof ApiError ? err : new ApiError({ status: 0, code: "network_error", message: String(err) }));
        }
      } finally {
        setStreaming(false);
        await qc.invalidateQueries({ queryKey: keys.messages(conversation) });
        setLive(null);
        qc.invalidateQueries({ queryKey: keys.conversations });
      }
    },
    [qc],
  );

  const send = useCallback(
    async (input: { text: string; files?: File[]; attachments?: string[] }) => {
      let conversation = id;
      try {
        if (!conversation) {
          const created = await client.ai.createConversation({ model: optionsRef.current.model });
          conversation = created.id;
          setId(created.id);
          optionsRef.current.onConversation?.(created);
        }
        const uploaded = await Promise.all(
          (input.files ?? []).map((f) => client.files.upload(f, { purpose: optionsRef.current.uploadPurpose ?? "chat" })),
        );
        const attachments = [...(input.attachments ?? []), ...uploaded.map((f) => f.id)];
        abortRef.current = new AbortController();
        const optimistic = {
          id: "pending-user",
          role: "user",
          content: input.text,
          status: "complete",
          attachments: [],
        } as unknown as ChatMessage;
        setLive({
          user: optimistic,
          assistant: { id: "pending-assistant", role: "assistant", content: "", reasoning: "", status: "streaming", sources: [] } as unknown as ChatMessage,
        });
        await consume(
          client.ai.send(
            conversation,
            { content: input.text, attachments, ...(optionsRef.current.model ? { model: optionsRef.current.model } : {}) },
            abortRef.current.signal,
          ),
          conversation,
        );
      } catch (err) {
        setLive(null);
        setError(err instanceof ApiError ? err : new ApiError({ status: 0, code: "network_error", message: String(err) }));
      }
    },
    [client, consume, id],
  );

  const stop = useCallback(() => {
    const target = live?.assistant.id;
    if (target && !target.startsWith("pending")) void client.ai.stop(target).catch(() => abortRef.current?.abort());
    else abortRef.current?.abort();
  }, [client, live]);

  const regenerate = useCallback(async () => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last || !id) return;
    abortRef.current = new AbortController();
    setLive({ assistant: { ...last, content: "", reasoning: "", status: "streaming" } });
    await consume(client.ai.regenerate(last.id, {}, abortRef.current.signal), id);
  }, [client, consume, id, messages]);

  const deleteConversation = useMutation({
    mutationFn: () => client.ai.deleteConversation(id as string),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.conversations }),
  });

  return {
    conversationId: id,
    messages,
    streaming,
    error,
    send,
    stop,
    regenerate,
    deleteConversation,
    loadingHistory: !!id && history.isPending,
    hasOlder: history.hasNextPage,
    loadOlder: () => void history.fetchNextPage(),
    /** For <Composer>. */
    composerProps: {
      onSubmit: (message: { text: string; files: File[] }) => void send(message),
      generating: streaming,
      onStop: stop,
    },
  };
}

/** Today's token usage against the daily limit. */
export function useAiUsage() {
  const client = usePleateClient();
  return useQuery({ queryKey: ["pleate", "ai", "usage"], queryFn: client.ai.usage });
}
