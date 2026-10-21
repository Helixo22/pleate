import { Bot } from "lucide-react";
import { Avatar, AvatarGroup } from "pleate/avatar";

export default function Demo() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <Avatar size="xs" name="Ada Lovelace" />
        <Avatar size="sm" name="Grace Hopper" />
        <Avatar size="md" name="Alan Turing" status="online" />
        <Avatar size="lg" name="Margaret Hamilton" status="away" />
        <Avatar size="xl" name="Linus Torvalds" shape="rounded" />
        <Avatar size="2xl" name="Barbara Liskov" status="busy" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Avatar src="https://i.pravatar.cc/160?img=32" name="Sofia Rossi" size="lg" />
        <Avatar src="https://broken.example/x.png" name="Fallback Shown" size="lg" />
        <Avatar icon={<Bot />} color="var(--pl-accent)" size="lg" shape="rounded" alt="Assistant" />
        <Avatar size="lg" />
      </div>
      <AvatarGroup max={4} size="md">
        {["Lena Park", "Omar Haddad", "Chiara Bianchi", "Jonas Berg", "Aiko Tanaka", "Diego Ruiz"].map((name) => (
          <Avatar key={name} name={name} />
        ))}
      </AvatarGroup>
    </div>
  );
}
