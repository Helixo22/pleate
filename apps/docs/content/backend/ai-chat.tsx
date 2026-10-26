import { C, Callout, Code, Endpoints, Errors, H2, H3, LI, P, Settings, Table, UL } from "@/components/backend/prose";
import { LiveDemo } from "@/components/backend/live-demo";
import ChatDemo from "@/demos/backend/chat";

export default function AiChat() {
  return (
    <>
      <P>
        <C>pleate_backend.ai_chat</C> stores conversations and streams answers from a model provider, with reasoning,
        sources, stop, regenerate and a daily token quota per user. It backs <C>ChatThread</C>, <C>Message</C>,{" "}
        <C>Composer</C>, <C>StreamingText</C>, <C>Reasoning</C>, <C>ModelPicker</C>, <C>PromptSuggestions</C> and{" "}
        <C>SourceList</C>. The provider is a setting: Anthropic, OpenAI, any OpenAI compatible server, or your own class.
      </P>

      <LiveDemo
        file="chat"
        title="Streaming chat"
        description="useChat creates the conversation on the first message and streams the answer; useModels and useSuggestions feed the picker and the suggestions."
        signIn
        hint={<>Type a message, or include [sources] to get a cited source</>}
      >
        <ChatDemo />
      </LiveDemo>

      <H2>Providers</H2>
      <H3>Anthropic</H3>
      <P>
        <C>pip install &quot;pleate-backend[anthropic]&quot;</C>. Thinking deltas become <C>reasoning</C> events, web
        search citations become <C>sources</C>, images go as base64 image blocks and PDFs as document blocks.
      </P>
      <Code lang="python" title="settings.py">{`
PLEATE["AI"] = {
    "PROVIDER": "pleate_backend.ai_chat.providers.AnthropicProvider",
    "PROVIDER_OPTIONS": {"api_key": env("ANTHROPIC_API_KEY"), "max_tokens": 8192},
    "MODELS": [
        {"id": "claude-sonnet-5-5", "name": "Sonnet", "description": "Balanced",
         "params": {"thinking": {"type": "adaptive"}}},
        {"id": "claude-opus-5-5", "name": "Opus", "description": "Most capable"},
        {"id": "claude-haiku-4-5-20251001", "name": "Haiku", "description": "Fastest"},
    ],
    "DEFAULT_MODEL": "claude-sonnet-5-5",
}
`}</Code>
      <H3>OpenAI and compatible servers</H3>
      <P>
        <C>pip install &quot;pleate-backend[openai]&quot;</C>. Works with OpenAI and anything that speaks its API: LiteLLM,
        vLLM, Ollama, OpenRouter. A model entry can carry its own <C>options</C> (base URL, key), so one picker can mix
        providers. Usage comes from <C>stream_options.include_usage</C>, and <C>reasoning_content</C> deltas (DeepSeek,
        vLLM, LiteLLM) become <C>reasoning</C> events.
      </P>
      <Code lang="python" title="settings.py">{`
PLEATE["AI"] = {
    "PROVIDER": "pleate_backend.ai_chat.providers.OpenAIProvider",
    "PROVIDER_OPTIONS": {"api_key": env("OPENAI_API_KEY")},
    "MODELS": [
        {"id": "gpt-5", "name": "GPT-5", "description": "Smart"},
        {"id": "llama", "name": "Llama", "description": "On our servers",
         "api_model": "llama-3.3-70b",
         "options": {"base_url": "http://litellm:4000/v1", "api_key": env("LITELLM_KEY")}},
    ],
    "DEFAULT_MODEL": "gpt-5",
}
`}</Code>
      <P>
        A <C>MODELS</C> entry may set <C>provider</C> and <C>options</C> (its own provider class and constructor options;
        the global <C>PROVIDER_OPTIONS</C> only apply to the global <C>PROVIDER</C>), <C>api_model</C> (the id sent
        upstream, defaults to <C>id</C>) and <C>params</C> (passed to the SDK call: temperature, max_tokens, thinking,
        reasoning_effort...). Only <C>id</C>, <C>name</C> and <C>description</C> are public.
      </P>
      <H3>Echo, for development</H3>
      <P>
        The default <C>EchoProvider</C> needs no key: it answers &quot;You said: ...&quot; word by word. <C>[error]</C> in a
        message makes it fail, <C>[sources]</C> makes it cite a source, and the <C>delay</C> option slows it down.
      </P>
      <H3>Your own provider</H3>
      <Code lang="python">{`
from pleate_backend.ai_chat.providers import Provider, ProviderError

class CookbookProvider(Provider):
    def stream(self, messages, *, model, system, options):
        # messages: the history (role, content, attachments); options: the model's params
        try:
            for chunk in my_sdk.stream(model=model, system=system, messages=messages, **options):
                yield {"type": "delta", "text": chunk.text}
        except my_sdk.RateLimited as exc:
            raise ProviderError("provider_rate_limited") from exc
        yield {"type": "usage", "input_tokens": 812, "output_tokens": 240}
`}</Code>
      <P>
        Events a provider yields: <C>delta</C>, <C>reasoning</C>, <C>sources</C> and <C>usage</C>. A{" "}
        <C>ProviderError</C> code reaches the user in the <C>error</C> event.
      </P>

      <H2>Endpoints</H2>
      <P>Mounted at <C>/api/ai</C>, signed in users only. Conversations and messages of other users answer 404.</P>
      <Endpoints
        rows={[
          ["GET", "/ai/models", <><C>{"{models: [{id, name, description}], default}"}</C></>],
          ["GET", "/ai/suggestions", <><C>{"[{id?, title, description?, prompt}]"}</C></>],
          ["GET", "/ai/usage", <><C>{"{today: {input_tokens, output_tokens, limit}}"}</C></>],
          ["GET", "/ai/conversations", <>Page list. <C>search</C> (title), <C>archived</C>, <C>pinned</C>, ordering <C>-last_message_at</C>, <C>-created_at</C>, <C>title</C>.</>],
          ["POST", "/ai/conversations", <><C>{"{title?, model?, system_prompt?}"}</C></>],
          ["GET|PATCH|DELETE", "/ai/conversations/<id>", <>Read, change (<C>title, model, system_prompt, pinned, archived</C>) or delete with its messages.</>],
          ["GET", "/ai/conversations/<id>/messages", "Cursor list: the first page is the latest messages, next_cursor loads older ones, each page in chronological order."],
          ["POST", "/ai/conversations/<id>/messages", <><C>{"{content, attachments?: [file ids], model?}"}</C>. Streams the answer.</>],
          ["POST", "/ai/messages/<id>/stop", <>202. The running answer ends with status <C>stopped</C>.</>],
          ["POST", "/ai/messages/<id>/regenerate", <><C>{"{model?}"}</C>, last assistant message only. Streams the new answer.</>],
        ]}
      />

      <H2>The stream</H2>
      <P>
        Sending answers with Server-Sent Events, unless the request has <C>Accept: application/json</C>: then it waits
        and answers <C>201 {"{user_message, assistant_message}"}</C> (regenerate answers{" "}
        <C>200 {"{assistant_message}"}</C>). Events, in order:
      </P>
      <Table
        head={["Event", "Data", "Count"]}
        mono={[0, 1]}
        rows={[
          ["user_message", "{message}", "1, on send only"],
          ["start", '{message} (role assistant, status "streaming")', "1"],
          ["reasoning", "{text}", "0..n"],
          ["sources", "{sources: [{title, url, snippet}]}", "0..n, the full list so far"],
          ["delta", "{text}", "0..n"],
          ["error", "{code, message, message_id}", "0..1, provider failures only"],
          ["done", "{message} (status complete | stopped | error)", "1, always last"],
        ]}
      />
      <Code lang="text" title="text/event-stream">{`
event: user_message
data: {"message": {"id": "…", "role": "user", "content": "Which products are low on stock?", …}}

event: start
data: {"message": {"id": "…", "role": "assistant", "status": "streaming", "content": "", …}}

event: reasoning
data: {"text": "The user wants inventory below the threshold."}

event: delta
data: {"text": "Three"}

event: delta
data: {"text": " products are below 10 units:"}

event: done
data: {"message": {"id": "…", "status": "complete", "content": "Three products are below 10 units: …", "input_tokens": 812, "output_tokens": 46, …}}
`}</Code>
      <UL>
        <LI>The stream never breaks with a 500. A provider failure sends <C>error</C>, saves the message with status <C>error</C> and <C>error_code</C>, then <C>done</C>.</LI>
        <LI>Validation and quota errors happen before the stream starts and are regular JSON errors.</LI>
        <LI>The assistant message is saved about every second while it streams, and at the end, also when the client disconnects. Reloading the page mid answer shows what was written so far.</LI>
        <LI>The first exchange titles an untitled conversation with the first message, cut to 60 characters on a word boundary.</LI>
        <LI>Regenerate keeps previous answers in <C>variants</C>, oldest first.</LI>
      </UL>
      <P>
        Messages have <C>role</C>, <C>content</C>, <C>reasoning</C>, <C>status</C>, <C>error_code</C>, <C>model</C>,{" "}
        <C>sources</C>, <C>attachments</C> (<C>{"[{id, name, content_type, size}]"}</C>), <C>variants</C>,{" "}
        <C>input_tokens</C>, <C>output_tokens</C> and <C>created_at</C>. Attachments are ids of files from the files app
        owned by the user; <C>useChat</C> uploads <C>File</C>s from the composer for you.
      </P>

      <H2>On the frontend</H2>
      <Code lang="tsx">{`
const models = useModels();
const chat = useChat(conversationId, {
  model: models.model,
  onConversation: (c) => router.replace(\`/chat/\${c.id}\`),   // when the first message creates it
});
const suggestions = useSuggestions((prompt) => chat.send({ text: prompt }));

<ChatThread>
  {chat.messages.map((m) => (
    <Message key={m.id} role={m.role}>
      {m.reasoning && <Reasoning active={m.status === "streaming"}>{m.reasoning}</Reasoning>}
      <StreamingText text={m.content} streaming={m.status === "streaming"} />
    </Message>
  ))}
</ChatThread>
<Composer {...chat.composerProps} toolbar={<ModelPicker {...models.modelPickerProps} />} />
`}</Code>
      <P>
        <C>useChat</C> returns <C>messages</C> (history plus the live answer), <C>streaming</C>, <C>error</C>,{" "}
        <C>send</C>, <C>stop</C>, <C>regenerate</C>, <C>deleteConversation</C>, <C>hasOlder</C> and <C>loadOlder</C> for
        scrolling back, and <C>composerProps</C>. <C>useConversations</C> lists conversations for a sidebar,{" "}
        <C>useAiUsage</C> reads today&apos;s quota.
      </P>

      <H2>Settings</H2>
      <P><C>{`PLEATE["AI"]`}</C>:</P>
      <Settings
        rows={[
          ["PROVIDER", "EchoProvider", "Dotted path of the provider class."],
          ["PROVIDER_OPTIONS", "{}", "Passed to the provider constructor."],
          ["MODELS", "[echo]", <>Models offered in the picker, see above.</>],
          ["DEFAULT_MODEL", '"echo"', "Used when the conversation and the request name none."],
          ["SYSTEM_PROMPT", '"You are a helpful assistant."', <>A conversation&apos;s <C>system_prompt</C> wins.</>],
          ["DAILY_TOKEN_LIMIT", "200000", <>Input plus output per user per UTC day. <C>None</C> for no limit.</>],
          ["MAX_HISTORY_MESSAGES", "40", "Messages sent to the model."],
          ["SUGGESTIONS", "[]", <><C>{"{title, description, prompt}"}</C> entries for PromptSuggestions.</>],
          ["MAX_MESSAGE_CHARS", "32000", "Longest message."],
          ["MAX_ATTACHMENTS", "10", "Files per message."],
        ]}
      />

      <H2>Error codes</H2>
      <Errors
        rows={[
          ["empty_message", "400", "No content."],
          ["message_too_long", "400", <>On <C>content</C>, over <C>MAX_MESSAGE_CHARS</C>.</>],
          ["too_many_attachments", "400", <>Over <C>MAX_ATTACHMENTS</C>.</>],
          ["attachment_not_found", "400", "A file id that does not exist or belongs to someone else."],
          ["invalid_model", "400", "Not one of MODELS."],
          ["quota_exceeded", "429", "Daily token limit reached."],
          ["cannot_regenerate", "409", "Not the last assistant message."],
          ["message_streaming", "409", "An answer is still streaming in this conversation."],
          ["throttled", "429", <>Scope <C>ai</C>, 30 per minute by default.</>],
          ["provider_error", "error event", "The provider failed."],
          ["provider_rate_limited", "error event", "The provider rate limited the request."],
          ["provider_unavailable", "error event", "The provider is down or timed out."],
          ["provider_not_configured", "error event", "Missing API key or SDK."],
        ]}
      />
      <Callout>
        The account export contains <C>ai_conversations</C> with every message. Deleting the account deletes
        conversations, messages and usage.
      </Callout>
    </>
  );
}
