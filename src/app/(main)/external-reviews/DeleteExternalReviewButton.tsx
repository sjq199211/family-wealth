"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteExternalReviewButton({ reviewId, title }: { reviewId: number; title: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/external-reviews/${reviewId}`, { method: "DELETE" });
      if (!res.ok) return;
      router.push("/external-reviews");
      router.refresh();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="text-sm text-red-500 hover:text-red-400">
        删除
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2 text-sm">
      <span className="text-[var(--text-muted)]">确认删除「{title}」？</span>
      <button type="button" onClick={handleDelete} disabled={loading} className="text-red-500 hover:text-red-400 disabled:opacity-50">
        {loading ? "删除中…" : "确认"}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="text-[var(--text-muted)] hover:underline">
        取消
      </button>
    </span>
  );
}
