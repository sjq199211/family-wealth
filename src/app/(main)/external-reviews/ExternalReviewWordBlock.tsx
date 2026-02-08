"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ExternalReviewWordBlock({
  reviewId,
  wordFileName,
  hasWord,
  isOwner,
}: {
  reviewId: number;
  wordFileName: string | null;
  hasWord: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [summaryError, setSummaryError] = useState("");

  async function parseErrorResponse(res: Response): Promise<string> {
    try {
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      return (data?.error as string) || text?.slice(0, 120) || "请求失败";
    } catch {
      return "请求失败";
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/external-reviews/${reviewId}/word`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        setUploadError(await parseErrorResponse(res));
        return;
      }
      router.refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSummarize() {
    setSummaryError("");
    setSummarizing(true);
    try {
      const res = await fetch(`/api/external-reviews/${reviewId}/summarize`, { method: "POST" });
      if (!res.ok) {
        setSummaryError(await parseErrorResponse(res));
        return;
      }
      router.refresh();
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setSummarizing(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4">
      {hasWord ? (
        <>
          <a
            href={`/api/external-reviews/${reviewId}/word`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded border border-[var(--border)] bg-slate-800/50 px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-slate-700/50"
          >
            阅读原文
            {wordFileName && <span className="ml-1 text-[var(--text-muted)]">({wordFileName})</span>}
          </a>
          {isOwner && (
            <label className="inline-flex cursor-pointer items-center rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-slate-800/50">
              {uploading ? "上传中…" : "更换文件"}
              <input
                type="file"
                accept=".txt,.doc,.docx,.pdf"
                className="sr-only"
                disabled={uploading}
                onChange={handleUpload}
              />
            </label>
          )}
        </>
      ) : isOwner ? (
        <label className="inline-flex cursor-pointer items-center rounded border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1.5 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/20">
          {uploading ? "上传中…" : "上传原文文件"}
          <input
            type="file"
            accept=".txt,.doc,.docx,.pdf"
            className="sr-only"
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
      ) : null}
      {isOwner && (hasWord || true) && (
        <button
          type="button"
          onClick={handleSummarize}
          disabled={summarizing}
          className="rounded border border-[var(--accent)] px-3 py-1.5 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10 disabled:opacity-50"
        >
          {summarizing ? "生成中…" : "生成 AI 总结"}
        </button>
      )}
      {uploadError && <span className="text-sm text-red-500">{uploadError}</span>}
      {summaryError && <span className="text-sm text-red-500">{summaryError}</span>}
    </div>
  );
}
