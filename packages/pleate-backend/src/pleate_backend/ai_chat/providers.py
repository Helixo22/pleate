"""
Model providers. A provider turns a conversation into a stream of chunks:

    {"type": "delta", "text": "Hel"}
    {"type": "reasoning", "text": "The user greets me."}
    {"type": "sources", "sources": [{"title": "...", "url": "https://...", "snippet": "..."}]}
    {"type": "usage", "input_tokens": 12, "output_tokens": 30}

``messages`` is a list of ``{"role", "content", "attachments"}`` where every
attachment is ``{"name", "content_type", "data": bytes}``. ``options`` are the
generation parameters of the model (``MODELS[i]["params"]``), passed as is to
the SDK call (temperature, max_tokens, thinking, reasoning_effort...).

Write your own by subclassing ``Provider`` and pointing ``PLEATE["AI"]["PROVIDER"]``
(or a model's ``"provider"``) at it. Raise ``ProviderError`` for failures the
user should see.
"""

import base64
import time
from collections.abc import Iterator

from django.utils.translation import gettext_lazy as _

IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif"}
TEXT_TYPES = {"text/plain", "text/csv", "text/markdown", "application/json"}


class ProviderError(Exception):
    """A failure with a stable code, shown to the user in the ``error`` event."""

    default_message = _("The assistant could not answer. Try again.")

    def __init__(self, code: str = "provider_error", message=None):
        self.code = code
        self.message = message or self.default_message
        super().__init__(f"{code}: {self.message}")


class Provider:
    def __init__(self, **options):
        self.options = options

    def stream(self, messages: list[dict], *, model: str, system: str, options: dict) -> Iterator[dict]:
        raise NotImplementedError


def _text(data: bytes) -> str:
    return data.decode("utf-8", errors="replace")


def _b64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")


class EchoProvider(Provider):
    """
    Deterministic provider for development and tests. Answers
    ``You said: <last user message>`` word by word. ``[error]`` in the message
    makes it fail after the first word, ``[sources]`` makes it cite a source.
    Option ``delay`` (seconds between words) makes the stream feel real.
    """

    def stream(self, messages, *, model, system, options):
        last = next(
            (m for m in reversed(messages) if m["role"] == "user"), {"content": "", "attachments": []}
        )
        text = " ".join(last["content"].split())
        names = [a["name"] for a in last.get("attachments") or []]
        answer = f"You said: {text}" if text else "You said nothing"
        if names:
            answer += " (" + ", ".join(names) + ")"
        delay = float(self.options.get("delay") or 0)

        yield {"type": "reasoning", "text": f"The user wrote {len(text.split())} words."}
        if "[sources]" in text:
            yield {
                "type": "sources",
                "sources": [
                    {"title": "Example", "url": "https://example.com", "snippet": "An example source."}
                ],
            }
        words = answer.split(" ")
        for i, word in enumerate(words):
            if delay:
                time.sleep(delay)
            yield {"type": "delta", "text": word if i == 0 else " " + word}
            if i == 0 and "[error]" in text:
                raise ProviderError("provider_error")
        input_tokens = sum(len(m["content"].split()) for m in messages) + len(system.split())
        yield {"type": "usage", "input_tokens": input_tokens, "output_tokens": len(words)}


class OpenAIProvider(Provider):
    """
    OpenAI Chat Completions, and every compatible server (LiteLLM, vLLM,
    Ollama, OpenRouter, Together...) through ``base_url``.

    Options: ``api_key``, ``base_url``, ``organization``, ``timeout``,
    ``max_retries``, ``default_headers``, ``http_client`` (an ``httpx2.Client``).
    """

    CLIENT_OPTIONS = (
        "api_key",
        "base_url",
        "organization",
        "timeout",
        "max_retries",
        "default_headers",
        "http_client",
    )

    def client(self):
        try:
            import openai
        except ImportError as exc:  # pragma: no cover
            raise ProviderError("provider_not_configured") from exc
        kwargs = {k: v for k, v in self.options.items() if k in self.CLIENT_OPTIONS and v is not None}
        return openai.OpenAI(**kwargs)

    @staticmethod
    def _content(message: dict):
        attachments = message.get("attachments") or []
        if not attachments:
            return message["content"]
        parts: list[dict] = []
        if message["content"]:
            parts.append({"type": "text", "text": message["content"]})
        for att in attachments:
            ct = att["content_type"]
            if ct in IMAGE_TYPES:
                parts.append(
                    {"type": "image_url", "image_url": {"url": f"data:{ct};base64,{_b64(att['data'])}"}}
                )
            elif ct == "application/pdf":
                parts.append(
                    {
                        "type": "file",
                        "file": {
                            "filename": att["name"],
                            "file_data": f"data:{ct};base64,{_b64(att['data'])}",
                        },
                    }
                )
            elif ct in TEXT_TYPES:
                parts.append({"type": "text", "text": f"{att['name']}:\n{_text(att['data'])}"})
            else:
                parts.append({"type": "text", "text": f"[{att['name']}]"})
        return parts

    def _messages(self, messages, system):
        out = [{"role": "system", "content": system}] if system else []
        for m in messages:
            if m["role"] == "user":
                out.append({"role": "user", "content": self._content(m)})
            else:
                out.append({"role": m["role"], "content": m["content"]})
        return out

    def stream(self, messages, *, model, system, options):
        import openai

        try:
            stream = self.client().chat.completions.create(
                model=model,
                messages=self._messages(messages, system),
                stream=True,
                stream_options={"include_usage": True},
                **(options or {}),
            )
            with stream:
                for chunk in stream:
                    citations = getattr(chunk, "citations", None)
                    if citations:
                        # Perplexity style servers send the cited urls on the chunk.
                        yield {
                            "type": "sources",
                            "sources": [
                                {"title": url, "url": url, "snippet": ""}
                                for url in citations
                                if isinstance(url, str)
                            ],
                        }
                    for choice in chunk.choices:
                        delta = choice.delta
                        # Not in the OpenAI schema, sent by DeepSeek, vLLM, LiteLLM, OpenRouter.
                        thought = getattr(delta, "reasoning_content", None) or getattr(
                            delta, "reasoning", None
                        )
                        if isinstance(thought, str) and thought:
                            yield {"type": "reasoning", "text": thought}
                        if delta.content:
                            yield {"type": "delta", "text": delta.content}
                    if chunk.usage:
                        yield {
                            "type": "usage",
                            "input_tokens": chunk.usage.prompt_tokens or 0,
                            "output_tokens": chunk.usage.completion_tokens or 0,
                        }
        except openai.RateLimitError as exc:
            raise ProviderError(
                "provider_rate_limited", _("The model is busy. Try again in a moment.")
            ) from exc
        except (openai.APIConnectionError, openai.APITimeoutError) as exc:
            raise ProviderError("provider_unavailable", _("The model is not reachable. Try again.")) from exc
        except openai.OpenAIError as exc:
            raise ProviderError("provider_error") from exc


class AnthropicProvider(Provider):
    """
    Anthropic Messages API with streaming. Thinking blocks become ``reasoning``
    chunks, web search citations become ``sources``.

    Options: ``api_key``, ``base_url``, ``timeout``, ``max_retries``,
    ``default_headers``, ``http_client`` and ``max_tokens`` (default 4096, a
    model's ``params`` can override it).
    """

    CLIENT_OPTIONS = ("api_key", "base_url", "timeout", "max_retries", "default_headers", "http_client")

    def client(self):
        try:
            import anthropic
        except ImportError as exc:  # pragma: no cover
            raise ProviderError("provider_not_configured") from exc
        kwargs = {k: v for k, v in self.options.items() if k in self.CLIENT_OPTIONS and v is not None}
        return anthropic.Anthropic(**kwargs)

    @staticmethod
    def _content(message: dict):
        attachments = message.get("attachments") or []
        if not attachments:
            return message["content"]
        blocks: list[dict] = []
        for att in attachments:
            ct = att["content_type"]
            if ct in IMAGE_TYPES:
                blocks.append(
                    {
                        "type": "image",
                        "source": {"type": "base64", "media_type": ct, "data": _b64(att["data"])},
                    }
                )
            elif ct == "application/pdf":
                blocks.append(
                    {
                        "type": "document",
                        "title": att["name"],
                        "source": {"type": "base64", "media_type": ct, "data": _b64(att["data"])},
                    }
                )
            elif ct in TEXT_TYPES:
                blocks.append(
                    {
                        "type": "document",
                        "title": att["name"],
                        "source": {"type": "text", "media_type": "text/plain", "data": _text(att["data"])},
                    }
                )
            else:
                blocks.append({"type": "text", "text": f"[{att['name']}]"})
        if message["content"]:
            blocks.append({"type": "text", "text": message["content"]})
        return blocks

    def _messages(self, messages, system):
        """System turns go to ``system``, consecutive turns of a role are merged."""
        systems = [system] if system else []
        out: list[dict] = []
        for m in messages:
            if m["role"] == "system":
                systems.append(m["content"])
                continue
            content = self._content(m) if m["role"] == "user" else m["content"]
            if not out and m["role"] != "user":
                continue
            if out and out[-1]["role"] == m["role"]:
                prev = out[-1]["content"]
                prev = [{"type": "text", "text": prev}] if isinstance(prev, str) else prev
                cur = [{"type": "text", "text": content}] if isinstance(content, str) else content
                out[-1]["content"] = prev + cur
            else:
                out.append({"role": m["role"], "content": content})
        return "\n\n".join(s for s in systems if s), out

    def stream(self, messages, *, model, system, options):
        import anthropic

        system_text, payload = self._messages(messages, system)
        params = {"max_tokens": self.options.get("max_tokens", 4096), **(options or {})}
        if system_text:
            params["system"] = system_text
        try:
            with self.client().messages.stream(model=model, messages=payload, **params) as stream:
                for event in stream:
                    if event.type == "text":
                        yield {"type": "delta", "text": event.text}
                    elif event.type == "thinking":
                        yield {"type": "reasoning", "text": event.thinking}
                    elif event.type == "citation":
                        url = getattr(event.citation, "url", None)
                        if url:
                            yield {
                                "type": "sources",
                                "sources": [
                                    {
                                        "title": getattr(event.citation, "title", None) or url,
                                        "url": url,
                                        "snippet": getattr(event.citation, "cited_text", "") or "",
                                    }
                                ],
                            }
                usage = stream.get_final_message().usage
                yield {
                    "type": "usage",
                    "input_tokens": (usage.input_tokens or 0)
                    + (usage.cache_creation_input_tokens or 0)
                    + (usage.cache_read_input_tokens or 0),
                    "output_tokens": usage.output_tokens or 0,
                }
        except anthropic.RateLimitError as exc:
            raise ProviderError(
                "provider_rate_limited", _("The model is busy. Try again in a moment.")
            ) from exc
        except (anthropic.APIConnectionError, anthropic.APITimeoutError) as exc:
            raise ProviderError("provider_unavailable", _("The model is not reachable. Try again.")) from exc
        except anthropic.AnthropicError as exc:
            raise ProviderError("provider_error") from exc
