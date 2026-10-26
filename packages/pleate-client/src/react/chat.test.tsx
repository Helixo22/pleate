import { act, renderHook, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { ChatMessage, Conversation } from "../api.ts";
import { composeAnswer } from "../mock/handlers/ai.ts";
import { createMockHandlers } from "../mock/index.ts";
import { BASE, createTestBackend } from "../test/backend.ts";
import { wrapper } from "../test/wrapper.tsx";
import { useChat, useConversations, useModels, useSuggestions } from "./chat.ts";

const { db, server } = createTestBackend();
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
beforeEach(() => {
  db.reset();
  // A few ms between words, so the answer is observable while it streams.
  server.resetHandlers(...createMockHandlers({ db, baseUrl: BASE, latency: 0, streamDelay: 4, liveNotificationInterval: 0 }));
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const FULL_DESCRIPTION_WORDS = composeAnswer("Describe the product", "plate-swift").text.split(" ").length;

describe("useChat", () => {
  it("creates the conversation, streams the answer, then shows the saved messages", async () => {
    const { Wrapper } = wrapper();
    const onConversation = vi.fn<(c: Conversation) => void>();
    const snapshots: { streaming: boolean; assistant?: ChatMessage }[] = [];
    const { result } = renderHook(
      () => {
        const chat = useChat(null, { onConversation });
        snapshots.push({ streaming: chat.streaming, assistant: chat.messages.find((m) => m.role === "assistant") });
        return chat;
      },
      { wrapper: Wrapper },
    );
    expect(result.current).toMatchObject({ conversationId: null, messages: [], streaming: false, error: null, loadingHistory: false });
    expect(result.current.composerProps).toEqual({ onSubmit: expect.any(Function), generating: false, onStop: expect.any(Function) });

    act(() => void result.current.send({ text: "Write a product description for the oak board" }));
    await waitFor(() => expect(onConversation).toHaveBeenCalledTimes(1));
    const conversation = onConversation.mock.calls[0][0];
    expect(conversation.id).toMatch(/^[0-9a-f]{24}$/);
    await waitFor(() => expect(result.current.conversationId).toBe(conversation.id));
    await waitFor(() => expect(result.current.streaming).toBe(true));
    expect(result.current.composerProps.generating).toBe(true);

    await waitFor(() => expect(result.current.streaming).toBe(false), { timeout: 3000 });
    await waitFor(() => expect(result.current.messages.every((m) => !m.id.startsWith("pending"))).toBe(true));
    const [user, assistant] = result.current.messages;
    expect(result.current.messages).toHaveLength(2);
    expect(user).toMatchObject({ role: "user", content: "Write a product description for the oak board", status: "complete" });
    expect(assistant).toMatchObject({ role: "assistant", status: "complete" });
    expect(assistant.content.split(" ")).toHaveLength(FULL_DESCRIPTION_WORDS);
    expect(assistant.reasoning).toContain("Reading the request");
    expect(result.current.error).toBeNull();

    // While streaming, the assistant message grew word by word.
    const partial = snapshots.filter((s) => s.streaming && s.assistant && s.assistant.content.length > 0);
    expect(partial.length).toBeGreaterThan(1);
    expect(partial[0].assistant!.content.length).toBeLessThan(assistant.content.length);
    expect(assistant.content.startsWith(partial[0].assistant!.content)).toBe(true);

    // Persisted on the backend.
    const saved = db.messages.filter((m) => m.conversation === conversation.id);
    expect(saved.map((m) => m.id).sort()).toEqual([user.id, assistant.id].sort());
    expect(db.conversations.find((c) => c.id === conversation.id)?.title).toBe("Write a product description for the oak board");
  });

  it("loads the history of an existing conversation", async () => {
    const convo = db.conversations.find((c) => c.title === "Plan a spring tasting menu")!;
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useChat(convo.id), { wrapper: Wrapper });
    expect(result.current.loadingHistory).toBe(true);
    await waitFor(() => expect(result.current.messages).toHaveLength(4));
    expect(result.current.messages.map((m) => m.role)).toEqual(["user", "assistant", "user", "assistant"]);
    expect(result.current.hasOlder).toBe(false);
  });

  it("stops a running answer", async () => {
    const convo = db.conversations[0];
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useChat(convo.id), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.loadingHistory).toBe(false));
    act(() => void result.current.send({ text: "Describe the linen napkins" }));
    await waitFor(() => {
      const last = result.current.messages.at(-1);
      expect(last?.role).toBe("assistant");
      expect(last?.status).toBe("streaming");
      expect(last?.id.startsWith("pending")).toBe(false);
      expect(last?.content.split(" ").length).toBeGreaterThan(3);
    });
    act(() => result.current.composerProps.onStop());
    await waitFor(() => expect(result.current.streaming).toBe(false), { timeout: 3000 });
    await waitFor(() => expect(result.current.messages.at(-1)?.status).toBe("stopped"));
    expect(result.current.messages.at(-1)!.content.split(" ").length).toBeLessThan(FULL_DESCRIPTION_WORDS);
  });

  it("regenerates the last answer and keeps the previous one as a variant", async () => {
    const convo = db.conversations.find((c) => c.title === "Last week's orders")!;
    const previous = db.messages.find((m) => m.conversation === convo.id && m.role === "assistant")!.content;
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useChat(convo.id), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    await act(() => result.current.regenerate());
    await waitFor(() => expect(result.current.messages.at(-1)?.variants).toEqual([previous]));
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages.at(-1)).toMatchObject({ role: "assistant", status: "complete" });
  });

  it("surfaces validation errors and provider errors", async () => {
    const convo = db.conversations[0];
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useChat(convo.id, { model: "plate-echo" }), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.loadingHistory).toBe(false));
    await act(() => result.current.send({ text: "   " }));
    await waitFor(() => expect(result.current.error?.code).toBe("empty_message"));
    await act(() => result.current.send({ text: "please fail [error]" }));
    await waitFor(() => expect(result.current.error?.code).toBe("provider_error"));
    await waitFor(() => expect(result.current.messages.at(-1)).toMatchObject({ status: "error", content: "You" }));
  });
});

describe("chat helpers", () => {
  it("useModels, useSuggestions and useConversations", async () => {
    const { Wrapper } = wrapper();
    const onSelect = vi.fn();
    const { result } = renderHook(
      () => ({ models: useModels(), suggestions: useSuggestions(onSelect), conversations: useConversations() }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.models.modelPickerProps.models).toHaveLength(3));
    expect(result.current.models.model).toBe("plate-swift");
    act(() => result.current.models.modelPickerProps.onValueChange("plate-sage"));
    expect(result.current.models.modelPickerProps.value).toBe("plate-sage");
    await waitFor(() => expect(result.current.suggestions.promptSuggestionsProps.suggestions.length).toBe(4));
    const first = result.current.suggestions.promptSuggestionsProps.suggestions[0];
    result.current.suggestions.promptSuggestionsProps.onSelect(first.prompt);
    expect(onSelect).toHaveBeenCalledWith(first.prompt);
    await waitFor(() => expect(result.current.conversations.total).toBe(5));
    expect(result.current.conversations.rows.every((c) => !c.archived)).toBe(true);
  });
});
