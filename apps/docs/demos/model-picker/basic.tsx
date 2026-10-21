"use client";

import { Brain, Image, Sparkles, Zap } from "lucide-react";
import { ModelPicker } from "pleate/ai/model-picker";
import { Badge } from "pleate/badge";
import { useState } from "react";

export default function Demo() {
  const [model, setModel] = useState("atlas");
  return (
    <div className="flex flex-wrap items-center gap-6">
      <ModelPicker
        value={model}
        onValueChange={setModel}
        models={[
          { id: "swift", group: "Chat", name: "Swift", icon: <Zap />, description: "Quick answers, low latency", badges: <Badge size="sm" tone="success">Fast</Badge> },
          { id: "atlas", group: "Chat", name: "Atlas", icon: <Sparkles />, description: "Best for planning and comparisons", badges: <Badge size="sm">Recommended</Badge> },
          { id: "sage", group: "Chat", name: "Sage", icon: <Brain />, description: "Thinks step by step on hard problems", badges: <Badge size="sm" tone="info">Reasoning</Badge> },
          { id: "lens", group: "Vision", name: "Lens", icon: <Image />, description: "Reads tickets, menus and signs", badges: <Badge size="sm" tone="warning">New</Badge> },
          { id: "legacy", group: "Vision", name: "Legacy", description: "Retired", disabled: true },
        ]}
      />
      <ModelPicker
        variant="field"
        value={model}
        onValueChange={setModel}
        models={[
          { id: "swift", name: "Swift" },
          { id: "atlas", name: "Atlas" },
          { id: "sage", name: "Sage" },
        ]}
      />
    </div>
  );
}
