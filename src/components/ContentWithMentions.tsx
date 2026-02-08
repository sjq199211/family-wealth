"use client";

import { getMentionFragments } from "@/lib/mentions";

export default function ContentWithMentions({ text }: { text: string }) {
  if (!text) return null;
  const parts = getMentionFragments(text);
  return (
    <span className="block whitespace-pre-wrap break-words">
      {parts.map((p, i) =>
        p.type === "mention" ? (
          <span
            key={i}
            className="rounded bg-[var(--accent)]/15 px-1 py-0.5 font-medium text-[var(--accent-hover)]"
          >
            @{p.value}
          </span>
        ) : (
          <span key={i}>{p.value}</span>
        )
      )}
    </span>
  );
}
