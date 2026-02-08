"use client";

import { useState, useRef } from "react";
import ContentWithMentions from "@/components/ContentWithMentions";

type Att = { id: number; type: string; filePath: string; originalName: string };
type Report = {
  id: number;
  title: string;
  body: string;
  isWeekly: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  memberId: number;
  member: { id: number; name: string };
  attachments: Att[];
};

export default function ReportDetail({ report, isOwner }: { report: Report; isOwner: boolean }) {
  const [attachments, setAttachments] = useState(report.attachments);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      for (let i = 0; i < files.length; i++) form.append("file", files[i]);
      const res = await fetch(`/api/reports/${report.id}/attachments`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上传失败");
      setAttachments((prev) => [
        ...prev,
        ...data.attachments.map((a: Att) => ({
          id: a.id,
          type: a.type,
          originalName: a.originalName,
          filePath: "",
        })),
      ]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      alert(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <article className="rounded border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
      {report.isWeekly && (
        <span className="mb-2 inline-block rounded border border-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 text-xs font-medium text-[var(--accent-hover)]">
          复盘与展望
        </span>
      )}
      <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">{report.title}</h1>
      <p className="mt-1 text-sm text-[var(--text-muted)]">
        {report.member.name}
        {" · "}
        {report.publishedAt
          ? new Date(report.publishedAt).toLocaleString("zh-CN")
          : new Date(report.createdAt).toLocaleString("zh-CN")}
      </p>
      <div className="mt-4 text-[var(--text-secondary)]">
        <ContentWithMentions text={report.body || "（无正文）"} />
      </div>

      {attachments.length > 0 && (
        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">附件</h3>
          <ul className="space-y-2">
            {attachments.map((a) => (
              <li key={a.id} className="flex items-center gap-2">
                {a.type === "image" ? (
                  <a
                    href={`/api/attachments/${a.id}?preview=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/attachments/${a.id}?preview=1`}
                      alt={a.originalName}
                      className="max-h-32 rounded border border-[var(--border)] object-cover"
                    />
                  </a>
                ) : (
                  <a
                    href={`/api/attachments/${a.id}`}
                    className="font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
                  >
                    {a.originalName}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOwner && (
        <div className="mt-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] disabled:opacity-50"
          >
            {uploading ? "上传中…" : "上传截图/文件"}
          </button>
        </div>
      )}
    </article>
  );
}
