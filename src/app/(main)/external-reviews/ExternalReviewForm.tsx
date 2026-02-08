"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MentionTextarea from "@/components/MentionTextarea";

type Member = { id: number; name: string };
type Review = { id?: number; title: string; body: string; source: string };

export default function ExternalReviewForm({
  review,
  members,
}: {
  review?: Review;
  members: Member[];
}) {
  const router = useRouter();
  const isEdit = !!review?.id;
  const [title, setTitle] = useState(review?.title ?? "");
  const [body, setBody] = useState(review?.body ?? "");
  const [source, setSource] = useState(review?.source ?? "");
  const [wordFile, setWordFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return;
    setLoading(true);
    try {
      const url = isEdit ? `/api/external-reviews/${review!.id}` : "/api/external-reviews";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), source: source.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存失败");
        return;
      }
      const reviewId = isEdit ? review!.id! : (data.id as number);
      if (wordFile && wordFile.size > 0) {
        const formData = new FormData();
        formData.append("file", wordFile);
        const uploadRes = await fetch(`/api/external-reviews/${reviewId}/word`, {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          let uploadError = "文件上传失败";
          try {
            const text = await uploadRes.text();
            const uploadData = text ? JSON.parse(text) : {};
            if (uploadData?.error) uploadError = uploadData.error;
            else if (text) uploadError = text.slice(0, 120);
          } catch {
            // 响应非 JSON 或为空时保留默认文案
          }
          setError(uploadError);
          return;
        }
      }
      router.push(`/external-reviews/${reviewId}`);
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
          className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
          placeholder="资料标题"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">来源</label>
        <input
          type="text"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
          placeholder="如 券商名称、链接等"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">原文文件（可选）</label>
        <label className="flex cursor-pointer items-center gap-2 rounded border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-slate-50">
          <input
            type="file"
            accept=".txt,.doc,.docx,.pdf"
            className="sr-only"
            onChange={(e) => setWordFile(e.target.files?.[0] ?? null)}
          />
          <span className="shrink-0 text-[var(--text-muted)]">选择文件</span>
          <span className="truncate">{wordFile?.name ?? "未选择"}</span>
        </label>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">支持 txt、doc、docx、pdf，发布后可在详情页阅读原文并生成 AI 总结</p>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">内容（输入 @ 可提及成员）</label>
        <MentionTextarea
          value={body}
          onChange={setBody}
          placeholder="摘录或总结，支持 @ 成员…"
          rows={8}
          members={members}
          className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-[var(--accent)] px-4 py-2 font-medium text-slate-900 hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {loading ? "保存中…" : isEdit ? "保存" : "发布"}
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
