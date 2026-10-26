import type { ChatMessage, Schema } from "../../api.ts";
import type { MockConversation, MockDb, MockMessage } from "../db.ts";
import type { Ctx, Router } from "../router.ts";
import { type MockSseEvent, sseResponse } from "../sse.ts";
import { cursor, fail, json, noContent, notFound, page, pub, query, sleep, truthy, validation } from "../util.ts";

const MAX_CHARS = 32_000;
const MAX_ATTACHMENTS = 10;
const DAILY_LIMIT = 200_000;

interface Answer {
  reasoning: string[];
  text: string;
  sources?: Schema<"Source">[];
  error?: boolean;
}

const PLATE_SOURCES: Schema<"Source">[] = [
  { title: "Plate care guide", url: "https://plate.dev/guides/care", snippet: "Stoneware is dishwasher safe at up to 60 degrees." },
  { title: "Plate shipping policy", url: "https://plate.dev/help/shipping", snippet: "Orders leave the studio within two business days." },
];

/** A canned, deterministic answer that reads like a real assistant. */
export function composeAnswer(prompt: string, model: string): Answer {
  const text = prompt.split(/\s+/).filter(Boolean).join(" ");
  const lower = text.toLowerCase();
  const wantsSources = /\[sources\]|source|cite|link|policy|guide/.test(lower);
  const error = lower.includes("[error]");
  if (model === "plate-echo") {
    return {
      reasoning: [`The user wrote ${text.split(" ").filter(Boolean).length} words.`],
      text: text ? `You said: ${text}` : "You said nothing",
      sources: lower.includes("[sources]") ? [{ title: "Example", url: "https://example.com", snippet: "An example source." }] : undefined,
      error,
    };
  }
  let reply: string;
  if (/menu|dinner|recipe|cook/.test(lower)) {
    reply =
      "Here is a seasonal idea. Start with a chilled pea soup, follow with grilled asparagus and burrata, then a lemon risotto. For the main course, roast spring carrots with whipped feta. Finish with rhubarb panna cotta. Plate each course on matte stoneware so the colors stand out.";
  } else if (/describ|copy|product/.test(lower)) {
    reply =
      "Made by hand in small batches, this piece has a soft speckled glaze and a weight that feels right in the hand. It goes from oven to table, stacks neatly and is dishwasher safe. Every glaze is a little different, so yours will be one of a kind.";
  } else if (/order|sales|summar|report/.test(lower)) {
    reply =
      "Last week brought 214 orders, 12% more than the week before. The Speckled Dinner Plate led with 61 units, followed by the Walnut Cutting Board and the Linen Napkin Set. Average order value rose to $74, and returning customers placed 38% of orders.";
  } else if (/reply|email|customer|answer/.test(lower)) {
    reply =
      "Hi there, thank you for reaching out and for your patience. Your order is on its way and the courier expects to deliver it within two days. We added free shipping to your next order as a small thank you. Warm regards, the Plate team";
  } else {
    reply = `Good question. ${text ? `About "${text.slice(0, 80)}": ` : ""}I would start small, try one change at a time and measure what happens over a week. If you share a bit more context, such as your goal and your constraints, I can give you a concrete plan.`;
  }
  return {
    reasoning: ["Reading the request and the conversation so far.", " Picking a clear structure for the answer."],
    text: reply,
    sources: wantsSources ? PLATE_SOURCES : undefined,
    error,
  };
}

function ownConversation(ctx: Ctx, id = ctx.params.id): MockConversation {
  const c = ctx.db.conversations.find((x) => x._owner === ctx.user.id && x.id === id);
  if (!c) throw notFound();
  return c;
}

function ownMessage(ctx: Ctx): MockMessage {
  const m = ctx.db.messages.find((x) => x._owner === ctx.user.id && x.id === ctx.params.id);
  if (!m) throw notFound();
  return m;
}

function checkModel(db: MockDb, model: unknown) {
  if (model && !db.models.some((m) => m.id === model)) {
    throw fail(400, "invalid_model", "This model is not available.");
  }
}

function checkQuota(ctx: Ctx) {
  const usage = ctx.db.aiUsage[ctx.user.id];
  if (usage && usage.input_tokens + usage.output_tokens >= DAILY_LIMIT) {
    throw fail(429, "quota_exceeded", "You reached today's limit. Try again tomorrow.");
  }
}

const msg = (m: MockMessage): ChatMessage => pub(m);

function titleFrom(content: string): string {
  const clean = content.split(/\s+/).filter(Boolean).join(" ");
  if (clean.length <= 60) return clean;
  const cut = clean.slice(0, 60);
  const space = cut.lastIndexOf(" ");
  return (space > 20 ? cut.slice(0, space) : cut).trim();
}

/** The event sequence of ai_chat.services.generate: start, reasoning, sources, delta..., error?, done. */
async function* generate(
  ctx: Ctx,
  conversation: MockConversation,
  assistant: MockMessage,
  prompt: string,
  signal: AbortSignal,
  userMessage?: MockMessage,
): AsyncGenerator<MockSseEvent> {
  const { db, options } = ctx;
  const answer = composeAnswer(prompt, assistant.model);
  let status: MockMessage["status"] = "complete";
  try {
    if (userMessage) yield { event: "user_message", data: { message: msg(userMessage) } };
    yield { event: "start", data: { message: msg(assistant) } };
    for (const part of answer.reasoning) {
      await sleep(options.streamDelay, signal);
      assistant.reasoning += part;
      yield { event: "reasoning", data: { text: part } };
    }
    if (answer.sources) {
      assistant.sources = answer.sources;
      yield { event: "sources", data: { sources: answer.sources } };
    }
    const words = answer.text.split(" ");
    for (let i = 0; i < words.length; i++) {
      if (assistant._stop || signal.aborted) {
        status = "stopped";
        break;
      }
      await sleep(options.streamDelay, signal);
      const text = i === 0 ? words[i] : ` ${words[i]}`;
      assistant.content += text;
      yield { event: "delta", data: { text } };
      if (i === 0 && answer.error) {
        status = "error";
        assistant.error_code = "provider_error";
        yield {
          event: "error",
          data: { code: "provider_error", message: "The assistant is not available right now.", message_id: assistant.id },
        };
        break;
      }
    }
  } finally {
    if (signal.aborted && status === "complete") status = "stopped";
    assistant.status = status;
    assistant._stop = false;
    assistant.input_tokens = prompt.split(/\s+/).filter(Boolean).length + 12;
    assistant.output_tokens = assistant.content.split(" ").filter(Boolean).length;
    const usage = (db.aiUsage[ctx.user.id] ??= { input_tokens: 0, output_tokens: 0 });
    usage.input_tokens += assistant.input_tokens;
    usage.output_tokens += assistant.output_tokens;
    conversation.last_message_at = new Date().toISOString();
    conversation.updated_at = conversation.last_message_at;
  }
  yield { event: "done", data: { message: msg(assistant) } };
}

function wantsJson(request: Request) {
  const accept = request.headers.get("Accept") ?? "";
  return accept.includes("application/json") && !accept.includes("text/event-stream");
}

async function drain(events: AsyncGenerator<MockSseEvent>): Promise<ChatMessage | null> {
  let final: ChatMessage | null = null;
  for await (const e of events) if (e.event === "done") final = (e.data as { message: ChatMessage }).message;
  return final;
}

export function aiRoutes(r: Router) {
  r.get("/ai/models", ({ db }) => json({ models: db.models, default: db.defaultModel }));
  r.get("/ai/suggestions", ({ db }) => json(db.suggestions));
  r.get("/ai/usage", ({ db, user }) => {
    const usage = db.aiUsage[user.id] ?? { input_tokens: 0, output_tokens: 0 };
    return json({ today: { ...usage, limit: DAILY_LIMIT } });
  });

  r.get("/ai/conversations", (ctx) => {
    const rows = query(
      ctx.db.conversations.filter((c) => c._owner === ctx.user.id),
      ctx.url,
      {
        search: ["title"],
        ordering: ["last_message_at", "created_at", "title"],
        defaultOrdering: "-last_message_at",
        filters: {
          archived: (c, v) => truthy(v) === undefined || !!c.archived === truthy(v),
          pinned: (c, v) => truthy(v) === undefined || !!c.pinned === truthy(v),
        },
      },
    );
    return json(page(rows, ctx.url, pub));
  });
  r.post("/ai/conversations", async (ctx) => {
    const data = await ctx.body();
    checkModel(ctx.db, data.model);
    const now = new Date().toISOString();
    const c: MockConversation = {
      id: ctx.db.id(),
      title: String(data.title ?? ""),
      model: String(data.model || ctx.db.defaultModel),
      system_prompt: String(data.system_prompt ?? ""),
      pinned: !!data.pinned,
      archived: !!data.archived,
      created_at: now,
      updated_at: now,
      last_message_at: now,
      _owner: ctx.user.id,
    };
    ctx.db.conversations.unshift(c);
    return json(pub(c), 201);
  });
  r.get("/ai/conversations/:id", (ctx) => json(pub(ownConversation(ctx))));
  r.patch("/ai/conversations/:id", async (ctx) => {
    const c = ownConversation(ctx);
    const data = await ctx.body();
    checkModel(ctx.db, data.model);
    if (data.title !== undefined) c.title = String(data.title).slice(0, 200);
    if (data.model) c.model = String(data.model);
    if (data.system_prompt !== undefined) c.system_prompt = String(data.system_prompt);
    if (data.pinned !== undefined) c.pinned = !!data.pinned;
    if (data.archived !== undefined) c.archived = !!data.archived;
    c.updated_at = new Date().toISOString();
    return json(pub(c));
  });
  r.delete("/ai/conversations/:id", (ctx) => {
    const c = ownConversation(ctx);
    ctx.db.conversations = ctx.db.conversations.filter((x) => x !== c);
    ctx.db.messages = ctx.db.messages.filter((m) => m.conversation !== c.id);
    return noContent();
  });

  r.get("/ai/conversations/:id/messages", (ctx) => {
    const c = ownConversation(ctx);
    const newestFirst = ctx.db.messages
      .filter((m) => m.conversation === c.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id));
    const result = cursor(newestFirst, ctx.url, msg, 50);
    return json({ ...result, results: result.results.reverse() });
  });

  r.post("/ai/conversations/:id/messages", async (ctx) => {
    const { db, user } = ctx;
    const conversation = ownConversation(ctx);
    const data = await ctx.body();
    const content = typeof data.content === "string" ? data.content : "";
    const attachments = Array.isArray(data.attachments) ? data.attachments.map(String) : [];
    if (content.length > MAX_CHARS) {
      throw validation({ content: { code: "message_too_long", message: `Messages can have at most ${MAX_CHARS} characters.` } });
    }
    if (!content.trim() && !attachments.length) throw fail(400, "empty_message", "Write a message or attach a file.");
    const model = String(data.model || conversation.model || db.defaultModel);
    checkModel(db, model);
    if (attachments.length > MAX_ATTACHMENTS) {
      throw fail(400, "too_many_attachments", `Attach at most ${MAX_ATTACHMENTS} files.`);
    }
    const files = attachments.map((fid: string) => {
      const f = db.files.find((x) => x.id === fid && x._owner === user.id);
      if (!f) throw fail(400, "attachment_not_found", "An attached file was not found.");
      return { id: f.id, name: f.name, content_type: f.content_type, size: f.size };
    });
    checkQuota(ctx);
    const now = Date.now();
    const base = { conversation: conversation.id, error_code: "", sources: [], variants: [], input_tokens: 0, output_tokens: 0, _owner: user.id };
    const userMessage: MockMessage = {
      ...base,
      id: db.id(),
      role: "user",
      content,
      reasoning: "",
      status: "complete",
      model: "",
      attachments: files,
      created_at: new Date(now).toISOString(),
    };
    const assistant: MockMessage = {
      ...base,
      id: db.id(),
      role: "assistant",
      content: "",
      reasoning: "",
      status: "streaming",
      model,
      attachments: [],
      created_at: new Date(now + 1).toISOString(),
    };
    db.messages.push(userMessage, assistant);
    conversation.model = model;
    conversation.last_message_at = userMessage.created_at;
    if (!conversation.title) conversation.title = titleFrom(content || files.map((f) => f.name).join(", "));
    const prompt = content + (files.length ? ` (${files.map((f) => f.name).join(", ")})` : "");
    if (wantsJson(ctx.request)) {
      const controller = new AbortController();
      const final = await drain(generate(ctx, conversation, assistant, prompt, controller.signal, userMessage));
      return json({ user_message: msg(userMessage), assistant_message: final }, 201);
    }
    return sseResponse((signal) => generate(ctx, conversation, assistant, prompt, signal, userMessage), ctx.request.signal);
  });

  r.post("/ai/messages/:id/stop", (ctx) => {
    const m = ownMessage(ctx);
    if (m.status === "streaming") m._stop = true;
    return json(msg(m), 202);
  });

  r.post("/ai/messages/:id/regenerate", async (ctx) => {
    const { db } = ctx;
    const message = ownMessage(ctx);
    const conversation = ownConversation(ctx, message.conversation);
    const last = db.messages
      .filter((m) => m.conversation === conversation.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id))[0];
    if (message.role !== "assistant" || last !== message) {
      throw fail(409, "cannot_regenerate", "Only the last answer can be regenerated.");
    }
    if (message.status === "streaming") throw fail(409, "message_streaming", "This answer is still being written.");
    const data = await ctx.body();
    const model = String(data.model || message.model || conversation.model || db.defaultModel);
    checkModel(db, model);
    checkQuota(ctx);
    if (message.content) message.variants = [...message.variants, message.content];
    Object.assign(message, { content: "", reasoning: "", sources: [], error_code: "", status: "streaming", model });
    const prompt =
      db.messages
        .filter((m) => m.conversation === conversation.id && m.role === "user")
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.content ?? "";
    if (wantsJson(ctx.request)) {
      const final = await drain(generate(ctx, conversation, message, prompt, new AbortController().signal));
      return json({ assistant_message: final });
    }
    return sseResponse((signal) => generate(ctx, conversation, message, prompt, signal), ctx.request.signal);
  });
}
