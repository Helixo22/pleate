"use client";

import { Globe, Sparkles } from "lucide-react";
import { Composer } from "pleate/ai/composer";
import { ModelPicker } from "pleate/ai/model-picker";
import { Tag } from "pleate/tag";
import { toast } from "pleate/toast";
import { useState } from "react";

export default function Demo() {
  const [generating, setGenerating] = useState(false);
  const [web, setWeb] = useState(true);
  const [model, setModel] = useState("atlas");
  return (
    <div className="grid w-full max-w-2xl gap-6">
      <Composer
        accept="image/*,.pdf,.txt"
        generating={generating}
        onStop={() => setGenerating(false)}
        onSubmit={({ text, files }) => {
          toast(`Sent: “${text || "attachment"}”`, { description: files.length ? `${files.length} file(s)` : undefined });
          setGenerating(true);
          setTimeout(() => setGenerating(false), 3000);
        }}
        onVoice={() => toast("Voice input")}
        toolbar={
          <>
            <ModelPicker
              value={model}
              onValueChange={setModel}
              side="top"
              models={[
                { id: "swift", name: "Swift", description: "Fast" },
                { id: "atlas", name: "Atlas", description: "Reasoning", icon: <Sparkles /> },
              ]}
            />
            <Tag size="sm" icon={<Globe />} selected={web} onClick={() => setWeb((v) => !v)}>
              Web
            </Tag>
          </>
        }
      />
      <Composer placeholder="Minimal: no attachments, no voice" onSubmit={({ text }) => toast(text)} />
    </div>
  );
}
