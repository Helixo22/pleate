from .models import Conversation, Message


def export_user_data(sender, user, **kwargs):
    """Conversations with their messages, for the account export."""
    conversations = list(Conversation.objects.filter(user=user).order_by("created_at"))
    by_conversation: dict = {c.pk: [] for c in conversations}
    if conversations:
        for m in Message.objects.filter(conversation_id__in=list(by_conversation)).order_by(
            "created_at", "id"
        ):
            by_conversation[m.conversation_id].append(
                {
                    "id": str(m.pk),
                    "role": m.role,
                    "content": m.content,
                    "reasoning": m.reasoning,
                    "status": m.status,
                    "model": m.model,
                    "sources": m.sources,
                    "attachments": m.attachments,
                    "variants": m.variants,
                    "input_tokens": m.input_tokens,
                    "output_tokens": m.output_tokens,
                    "created_at": m.created_at.isoformat(),
                }
            )
    return (
        "ai_conversations",
        [
            {
                "id": str(c.pk),
                "title": c.title,
                "model": c.model,
                "system_prompt": c.system_prompt,
                "pinned": c.pinned,
                "archived": c.archived,
                "created_at": c.created_at.isoformat(),
                "last_message_at": c.last_message_at.isoformat(),
                "messages": by_conversation[c.pk],
            }
            for c in conversations
        ],
    )
