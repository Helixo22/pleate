"use client";

import { RefreshCw, SquarePen } from "lucide-react";
import { BotFace } from "pleate/ai/bot-face";
import { ChatThread, Message, MessageAction } from "pleate/ai/chat";
import { Composer } from "pleate/ai/composer";
import { ModelPicker } from "pleate/ai/model-picker";
import { PromptSuggestions } from "pleate/ai/prompt-suggestions";
import { Reasoning } from "pleate/ai/reasoning";
import { SourceList } from "pleate/ai/result-card";
import { StreamingText, TypingIndicator } from "pleate/ai/streaming-text";
import { IconButton } from "pleate/icon-button";
import { useChat, useModels, useSuggestions } from "pleate-client/react";
import { useState } from "react";

function Conversation({ onNew }: { onNew: () => void }) {
  const models = useModels();
  // null: the first message creates the conversation, then streams the answer (SSE).
  const chat = useChat(null, { model: models.model });
  const suggestions = useSuggestions((prompt) => void chat.send({ text: prompt }));
  const last = chat.messages[chat.messages.length - 1];

  return (
    <div className="flex h-[36rem] w-full flex-col overflow-hidden rounded-3xl border border-separator bg-bg">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-separator px-4">
        <BotFace state={chat.streaming ? "speaking" : "idle"} size={32} decorative />
        <p className="min-w-0 flex-1 truncate text-headline">Plate assistant</p>
        <IconButton aria-label="New chat" size="sm" variant="plain" tone="neutral" icon={<SquarePen />} onClick={onNew} />
      </div>

      {chat.messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-6">
          <p className="text-title3 text-center">What shall we cook up?</p>
          <PromptSuggestions
            {...suggestions.promptSuggestionsProps}
            onSelect={(prompt) => void chat.send({ text: prompt })}
            className="w-full max-w-xl"
          />
        </div>
      ) : (
        <ChatThread className="flex-1">
          {chat.messages.map((m) =>
            m.role === "user" ? (
              <Message key={m.id} role="user" status="sent">
                {m.content}
              </Message>
            ) : (
              <Message
                key={m.id}
                role="assistant"
                variant="document"
                footer={
                  m.sources?.length ? (
                    <SourceList
                      className="mt-2"
                      sources={m.sources.map((s) => ({ href: s.url, title: s.title, site: new URL(s.url).hostname }))}
                    />
                  ) : undefined
                }
                actions={
                  m === last && !chat.streaming ? (
                    <MessageAction label="Regenerate" onClick={() => void chat.regenerate()}>
                      <RefreshCw />
                    </MessageAction>
                  ) : undefined
                }
              >
                <div className="flex flex-col gap-3">
                  {m.reasoning && (
                    <Reasoning active={m.status === "streaming" && !m.content}>
                      <p className="text-subhead text-fg-muted">{m.reasoning}</p>
                    </Reasoning>
                  )}
                  {m.status === "streaming" && !m.content && !m.reasoning && <TypingIndicator />}
                  {m.content && <StreamingText text={m.content} streaming={m.status === "streaming"} />}
                </div>
              </Message>
            ),
          )}
          {chat.error && <p className="px-4 text-footnote text-danger-ink">{chat.error.message}</p>}
        </ChatThread>
      )}

      <div className="shrink-0 px-3 pt-1 pb-3">
        <Composer
          {...chat.composerProps}
          placeholder="Ask about recipes, orders or stock"
          toolbar={<ModelPicker {...models.modelPickerProps} side="top" />}
        />
      </div>
    </div>
  );
}

export default function ChatDemo() {
  const [key, setKey] = useState(0);
  return <Conversation key={key} onNew={() => setKey((k) => k + 1)} />;
}
