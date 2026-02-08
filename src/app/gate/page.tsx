"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GatePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "验证失败");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-nav)] p-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-700/50 bg-slate-900/90 shadow-2xl p-8">
        <h1 className="text-xl font-semibold tracking-tight text-center text-[var(--accent-muted)] mb-1">
          家庭财富
        </h1>
        <p className="text-sm text-slate-400 text-center mb-6">
          请输入访问码进入
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="访问码"
            className="w-full px-4 py-3 rounded border border-slate-600 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            autoFocus
            disabled={loading}
          />
          {error && (
            <p className="text-sm text-[var(--danger)]">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-3 rounded bg-[var(--accent)] text-slate-900 font-semibold hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            {loading ? "验证中…" : "进入"}
          </button>
        </form>
      </div>
    </div>
  );
}
