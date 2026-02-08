"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MentionTextarea from "@/components/MentionTextarea";

type Member = { id: number; name: string };

export default function ReportNewForm({
  canPublishWeekly,
  defaultWeekly = false,
  members,
}: {
  canPublishWeekly: boolean;
  defaultWeekly?: boolean;
  members: Member[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isWeekly, setIsWeekly] = useState(defaultWeekly);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), isWeekly: canPublishWeekly && isWeekly }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "发布失败");
        return;
      }
      router.push(`/reports/${data.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">标题</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          required
          placeholder="研报标题"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">正文（输入 @ 可提及成员）</label>
        <MentionTextarea
          value={body}
          onChange={setBody}
          placeholder="支持多行文字，输入 @ 选择成员…"
          rows={8}
          members={members}
          className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </div>
      {canPublishWeekly && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isWeekly}
            onChange={(e) => setIsWeekly(e.target.checked)}
            className="rounded border-slate-400 text-[var(--accent)] focus:ring-[var(--accent)]"
          />
          <span className="text-sm text-[var(--text-secondary)]">作为本周复盘与展望发布</span>
        </label>
      )}
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-[var(--accent)] px-4 py-2 font-medium text-slate-900 hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {loading ? "发布中…" : "发布"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-[var(--border)] px-4 py-2 text-[var(--text-secondary)] hover:bg-slate-50"
        >
          取消
        </button>
      </div>
    </form>
  );
}
