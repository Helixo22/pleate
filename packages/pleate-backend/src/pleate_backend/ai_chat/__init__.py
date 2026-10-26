"""
AI chat: conversations, streamed answers, reasoning, sources, stop and
regenerate, daily token quota. Backs the pleate AI components (ChatThread,
Message, Composer, StreamingText, Reasoning, ModelPicker, PromptSuggestions,
ResultCard, SourceList).

Endpoints (mounted under ``/api/ai/``, signed in users only)
-------------------------------------------------------------

    GET    models                              {"models": [{id, name, description}], "default": "echo"}
    GET    suggestions                         [{id?, title, description?, prompt}]
    GET    usage                               {"today": {input_tokens, output_tokens, limit}}
    GET    conversations                       page paginated; search=<title>, archived=, pinned=,
                                               ordering=-last_message_at | -created_at | title
    POST   conversations                       {title?, model?, system_prompt?}
    GET    conversations/<id>
    PATCH  conversations/<id>                  {title?, model?, system_prompt?, pinned?, archived?}
    DELETE conversations/<id>                  deletes its messages too
    GET    conversations/<id>/messages         cursor paginated, see below
    POST   conversations/<id>/messages         {content, attachments?: [file ids], model?}
    POST   messages/<id>/stop                  202, the running answer ends with status "stopped"
    POST   messages/<id>/regenerate            {model?}, only the last assistant message

Conversations and messages of other users answer 404.

Message history uses cursor pagination: the first page holds the latest
messages and ``next_cursor`` loads older ones, while the messages of each page
are in chronological order. A chat view renders a page top to bottom and
prepends older pages when the user scrolls up.

Sending a message
-----------------

The answer is streamed as Server-Sent Events (``text/event-stream``) unless
the request has ``Accept: application/json``, in which case the endpoint
waits for the end and answers ``201 {"user_message", "assistant_message"}``
(regenerate answers ``200 {"assistant_message"}``). Events, in order::

    event: user_message     {"message": {...role "user"...}}           (send only)
    event: start            {"message": {...role "assistant", status "streaming"...}}
    event: reasoning        {"text": "The user greets me."}            (0..n)
    event: sources          {"sources": [{"title", "url", "snippet"}]} (0..n, the full list so far)
    event: delta            {"text": "Hel"}                            (0..n)
    event: error            {"code": "provider_error", "message": "...", "message_id": "..."}
    event: done             {"message": {...final, status complete | stopped | error...}}

``done`` is always the last event. ``error`` comes only when the provider
failed: the stream never breaks with a 500, the message is saved with status
``error`` and ``error_code``. Validation and quota errors happen before the
stream starts and are regular JSON errors.

Messages have ``role`` (user, assistant, system), ``content``, ``reasoning``,
``status`` (complete, streaming, stopped, error), ``error_code``, ``model``,
``sources``, ``attachments`` (``[{id, name, content_type, size}]``),
``variants`` (previous answers kept by regenerate, oldest first),
``input_tokens``, ``output_tokens`` and ``created_at``. The assistant message
is saved while it streams (about every second) and at the end, also when the
client disconnects.

Error codes: ``empty_message``, ``message_too_long`` (field ``content``),
``too_many_attachments``, ``attachment_not_found`` (files must belong to the
user), ``invalid_model``, ``quota_exceeded`` (429), ``cannot_regenerate``
(409), ``message_streaming`` (409), ``throttled`` (429, scope ``ai``). In the
``error`` event: ``provider_error``, ``provider_rate_limited``,
``provider_unavailable``, ``provider_not_configured``.

The first exchange titles an untitled conversation with the first user message,
cut to 60 characters on a word boundary.

Settings
--------

    PLEATE["AI"] = {
        "PROVIDER": "pleate_backend.ai_chat.providers.EchoProvider",  # dotted path
        "PROVIDER_OPTIONS": {},              # passed to the provider constructor
        "MODELS": [{"id": "echo", "name": "Echo", "description": "..."}],
        "DEFAULT_MODEL": "echo",
        "SYSTEM_PROMPT": "You are a helpful assistant.",  # a conversation's system_prompt wins
        "DAILY_TOKEN_LIMIT": 200_000,        # input + output per user per UTC day, None for no limit
        "MAX_HISTORY_MESSAGES": 40,          # messages sent to the model
        "SUGGESTIONS": [{"title": "Plan a trip", "description": "...", "prompt": "..."}],
        "MAX_MESSAGE_CHARS": 32_000,         # optional
        "MAX_ATTACHMENTS": 10,               # optional
    }

A ``MODELS`` entry can also carry ``"provider"`` and ``"options"`` (it then
uses its own provider and constructor options instead of the global ones;
the global ``PROVIDER_OPTIONS`` apply only to the global ``PROVIDER``),
``"api_model"`` (the id sent upstream, defaults to ``id``) and ``"params"``
(generation parameters passed to the SDK call: temperature, max_tokens,
thinking, reasoning_effort...). Only ``id``, ``name`` and ``description`` are
public. The throttle scope is ``ai`` (``REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]``).

Providers
---------

``EchoProvider`` answers "You said: ..." word by word, for development. Option
``delay`` (seconds) slows it down. ``[error]`` in a message makes it fail,
``[sources]`` makes it cite a source.

OpenAI and every OpenAI compatible server (LiteLLM, vLLM, Ollama, OpenRouter)
with ``pip install pleate-backend[openai]``::

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

Images go as data URLs, PDFs as file parts, text files inline. Usage comes
from ``stream_options.include_usage``; ``reasoning_content`` deltas (DeepSeek,
vLLM, LiteLLM) become ``reasoning`` events.

Anthropic with ``pip install pleate-backend[anthropic]``::

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

Thinking deltas become ``reasoning`` events, web search citations become
``sources``, images go as base64 image blocks and PDFs as document blocks.

Attachments are ids of ``pleate_backend.files`` files owned by the user; their
bytes are read with ``files.services.open_file`` when the history is built.

The account export (``/auth/me/export``) contains ``ai_conversations`` with
every message. Deleting the account deletes conversations, messages and usage.
"""
