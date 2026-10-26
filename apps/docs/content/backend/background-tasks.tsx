import { C, Callout, Code, H2, LI, P, Table, UL } from "@/components/backend/prose";

export default function BackgroundTasks() {
  return (
    <>
      <P>
        Work that should not slow down a request runs on Celery: sending emails, delivering webhooks, periodic
        housekeeping. The base settings configure Celery for you (<C>CELERY_*</C> keys), and{" "}
        <C>pleate_backend.settings.redis(url)</C> points the broker at Redis.
      </P>

      <H2>Running a worker</H2>
      <Code lang="python" title="myproject/celery.py">{`
import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "myproject.settings")

app = Celery("myproject")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
`}</Code>
      <Code lang="sh">{`# development: one process with the beat scheduler embedded
celery -A myproject worker -B -l info

# production: workers and exactly one beat
celery -A myproject worker -l info -c 4
celery -A myproject beat -l info`}</Code>
      <P>
        Tasks are acknowledged late and requeued if a worker dies (<C>CELERY_TASK_ACKS_LATE</C>,{" "}
        <C>CELERY_TASK_REJECT_ON_WORKER_LOST</C>), so write them to be safe to run twice. Results are not stored.
      </P>

      <H2>Built in tasks</H2>
      <Table
        head={["Task", "When", "Does"]}
        mono={[0]}
        rows={[
          ["pleate_backend.emails.send", "On every send_email", "Renders and sends one email. Retries five times with backoff on network errors."],
          ["pleate_backend.webhooks.tasks.deliver", "On every dispatch", "Posts one webhook delivery."],
          ["pleate_backend.webhooks.tasks.retry_due", "Every minute (beat)", "Retries failed deliveries whose next attempt is due."],
          ["pleate_backend.core.tasks.cleanup", "Every hour (beat)", "Runs every registered cleanup function."],
        ]}
      />
      <Code lang="python" title="pleate_backend/settings.py">{`
CELERY_BEAT_SCHEDULE = {
    "pleate-cleanup": {"task": "pleate_backend.core.tasks.cleanup", "schedule": 60 * 60},
    "pleate-webhook-retries": {"task": "pleate_backend.webhooks.tasks.retry_due", "schedule": 60},
}
`}</Code>
      <P>Add your own entries by extending the dict in your settings:</P>
      <Code lang="python">{`
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE |= {
    "weekly-report": {"task": "reports.tasks.weekly", "schedule": crontab(hour=7, minute=0, day_of_week=1)},
}
`}</Code>

      <H2>The cleanup registry</H2>
      <P>
        Housekeeping that belongs to an app registers itself instead of adding a beat entry. The files app uses it to
        remove direct uploads that were never completed:
      </P>
      <Code lang="python" title="myapp/handlers.py">{`
from datetime import timedelta
from django.utils import timezone
from pleate_backend.core.tasks import register_cleanup

@register_cleanup
def drop_abandoned_carts():
    Cart.objects.filter(updated_at__lt=timezone.now() - timedelta(days=30)).delete()
`}</Code>
      <P>
        Each function runs in its own <C>try</C>: one failing cleanup is logged and the others still run.
      </P>
      <Callout tone="tip" title="Prefer TTL indexes for expiry">
        Data that simply expires does not need a task. MongoDB deletes it on its own with a TTL index, which is how
        notifications, activity entries and webhook delivery logs expire. Create one from a <C>post_migrate</C> handler:{" "}
        <C>ensure_ttl_index(Model, &quot;created_at&quot;, seconds)</C> from <C>pleate_backend.core.mongo</C>.
      </Callout>

      <H2>Writing tasks</H2>
      <UL>
        <LI>Name tasks explicitly, <C>{'@shared_task(name="myapp.tasks.export")'}</C>, so renaming a module does not orphan queued messages.</LI>
        <LI>Pass ids, not model instances, and reload inside the task.</LI>
        <LI>Make them idempotent: with late acknowledgement a task may run again after a crash.</LI>
        <LI>Tell the user when a long task ends with <C>notify()</C>; it reaches the open page through SSE.</LI>
      </UL>
      <Code lang="python">{`
from celery import shared_task
from pleate_backend.notifications.services import notify

@shared_task(name="reports.tasks.export_orders")
def export_orders(user_id):
    user = User.objects.get(pk=user_id)
    file = build_export(user)                     # e.g. save_upload(...) into the files app
    notify(user, "export.ready", "Your export is ready", url=f"/files/{file.pk}")
`}</Code>

      <H2>Without a worker</H2>
      <P>
        In tests set <C>CELERY_TASK_ALWAYS_EAGER = True</C> and tasks run inline. Without Redis in development, set{" "}
        <C>{`PLEATE["EMAILS"]["ASYNC"] = False`}</C>: emails are sent inline, and webhook deliveries are still recorded
        and retried once a worker runs.
      </P>
    </>
  );
}
