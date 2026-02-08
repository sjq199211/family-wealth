"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MentionTextarea from "@/components/MentionTextarea";

type Member = { id: number; name: string };
type Strategy = {
  id?: number;
  symbol: string;
  entryLevel: number | null;
  addPosition: number | null;
  reducePosition: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  positionMgmt: string;
  difficulty: number;
  trendComment: string;
};

const numOrEmpty = (v: number | null | undefined): string | number => (v != null ? v : "");

export default function StockStrategyForm({
  strategy,
  members,
}: {
  strategy?: Strategy;
  members: Member[];
}) {
  const router = useRouter();
  const isEdit = !!strategy?.id;
  const [symbol, setSymbol] = useState(strategy?.symbol ?? "");
  const [entryLevel, setEntryLevel] = useState<string | number>(numOrEmpty(strategy?.entryLevel));
  const [addPosition, setAddPosition] = useState<string | number>(numOrEmpty(strategy?.addPosition));
  const [reducePosition, setReducePosition] = useState<string | number>(numOrEmpty(strategy?.reducePosition));
  const [stopLoss, setStopLoss] = useState<string | number>(numOrEmpty(strategy?.stopLoss));
  const [takeProfit, setTakeProfit] = useState<string | number>(numOrEmpty(strategy?.takeProfit));
  const [positionMgmt, setPositionMgmt] = useState(strategy?.positionMgmt ?? "");
  const [difficulty, setDifficulty] = useState(strategy?.difficulty ?? 1);
  const [trendComment, setTrendComment] = useState(strategy?.trendComment ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toNum = (v: string | number) => (v === "" ? null : Number(v));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!symbol.trim()) return;
    setLoading(true);
    try {
      const url = isEdit ? `/api/stock-strategies/${strategy!.id}` : "/api/stock-strategies";
      const method = isEdit ? "PATCH" : "POST";
      const body = {
        symbol: symbol.trim(),
        entryLevel: toNum(entryLevel),
        addPosition: toNum(addPosition),
        reducePosition: toNum(reducePosition),
        stopLoss: toNum(stopLoss),
        takeProfit: toNum(takeProfit),
        positionMgmt: positionMgmt.trim(),
        difficulty,
        trendComment: trendComment.trim(),
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存失败");
        return;
      }
      router.push(isEdit ? `/stock-strategies/${strategy!.id}` : "/stock-strategies");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">标的</label>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
          placeholder="如 600519 或 贵州茅台"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">入场位</label>
          <input type="number" step="any" value={entryLevel} onChange={(e) => setEntryLevel(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none" placeholder="可选" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">加仓位</label>
          <input type="number" step="any" value={addPosition} onChange={(e) => setAddPosition(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none" placeholder="可选" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">减仓位</label>
          <input type="number" step="any" value={reducePosition} onChange={(e) => setReducePosition(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none" placeholder="可选" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">止损位</label>
          <input type="number" step="any" value={stopLoss} onChange={(e) => setStopLoss(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none" placeholder="可选" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">出场位</label>
          <input type="number" step="any" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value === "" ? "" : Number(e.target.value))} className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none" placeholder="可选" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">仓位管理</label>
        <input
          type="text"
          value={positionMgmt}
          onChange={(e) => setPositionMgmt(e.target.value)}
          className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
          placeholder="可选，如 底仓 3 成，加仓后不超过 5 成"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">操作难度（1星到5星）</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((d) => (
            <button key={d} type="button" onClick={() => setDifficulty(d)} className={`h-10 w-10 rounded border text-sm font-medium ${difficulty === d ? "border-[var(--accent)] bg-[var(--accent)] text-slate-900" : "border-[var(--border)] bg-white text-[var(--text-muted)] hover:border-slate-300"}`}>
              {d}★
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">个股分析（输入 @ 可提及成员）</label>
        <MentionTextarea value={trendComment} onChange={setTrendComment} placeholder="简要点评，支持 @ 成员…" rows={4} members={members} className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none" />
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="rounded bg-[var(--accent)] px-4 py-2 font-medium text-slate-900 hover:bg-[var(--accent-hover)] disabled:opacity-50">
          {loading ? "保存中…" : isEdit ? "保存" : "添加"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded border border-[var(--border)] px-4 py-2 text-[var(--text-secondary)] hover:bg-slate-50">取消</button>
      </div>
    </form>
  );
}
