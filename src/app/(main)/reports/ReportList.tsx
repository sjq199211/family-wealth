"use client";

import Link from "next/link";

type Report = {
  id: number;
  title: string;
  body: string;
  createdAt: Date;
  member: { name: string };
  attachments: { id: number; type: string; originalName: string }[];
};

export default function ReportList({
  initialList,
  total,
}: {
  initialList: Report[];
  total: number;
}) {
  if (initialList.length === 0) {
    return (
      <div className="rounded border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center text-[var(--text-muted)]">
        暂无研报，
        <Link href="/reports/new" className="ml-1 font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">
          去发布一条
        </Link>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {initialList.map((r) => (
        <li key={r.id}>
          <Link
            href={`/reports/${r.id}`}
            className="block rounded border border-[var(--border)] bg-[var(--bg-card)] p-4 transition hover:border-slate-300 hover:shadow-sm"
          >
            <h2 className="font-medium text-[var(--text-primary)]">{r.title}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">
              {r.body || "（无正文）"}
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {r.member.name}
              {r.attachments.length > 0 && ` · ${r.attachments.length} 个附件`}
              {" · "}
              {new Date(r.createdAt).toLocaleString("zh-CN")}
            </p>
          </Link>
        </li>
      ))}
      {total > initialList.length && (
        <li className="text-center text-sm text-[var(--text-muted)]">
          共 {total} 条，仅展示最新 20 条
        </li>
      )}
    </ul>
  );
}
