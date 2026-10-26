from django.contrib import admin

from .models import Conversation, DailyUsage, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    fields = ["role", "status", "model", "content", "input_tokens", "output_tokens", "created_at"]
    readonly_fields = fields
    show_change_link = True


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ["title", "user", "model", "pinned", "archived", "last_message_at"]
    list_filter = ["pinned", "archived", "model"]
    search_fields = ["title"]
    readonly_fields = ["user", "created_at", "updated_at", "last_message_at"]
    inlines = [MessageInline]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ["conversation", "role", "status", "model", "input_tokens", "output_tokens", "created_at"]
    list_filter = ["role", "status", "model"]
    readonly_fields = ["conversation", "created_at"]


@admin.register(DailyUsage)
class DailyUsageAdmin(admin.ModelAdmin):
    list_display = ["user", "day", "input_tokens", "output_tokens"]
    list_filter = ["day"]
    readonly_fields = ["user", "day"]
