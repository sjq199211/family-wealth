"use client";

import { useState } from "react";

type Result = {
  id: number;
  tradeDate: Date | string;
  symbol: string;
  side: string;
  amount: number | null;
  pnl: number | null;
  note: string;
};

export default function TradingResultsSection({ initialResults }: { initialResults: Result[] }) {
  const [results, setResults] = useState(initialResults);
  const totalPnl = results.reduce((s, r) => s + (r.pnl ?? 0), 0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    tradeDate: new Date().toISOString().slice(0, 10),
    symbol: "",
    side: "buy",
    amount: "",
    pnl: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/me/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tradeDate: form.tradeDate,
          symbol: form.symbol.trim(),
          side: form.side,
          amount: form.amount === "" ? null : parseFloat(form.amount),
          pnl: form.pnl === "" ? null : parseFloat(form.pnl),
          note: form.note.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "添加失败");
      setResults((prev) => [{ ...data, tradeDate: data.tradeDate }, ...prev]);
      setForm({
        tradeDate: new Date().toISOString().slice(0, 10),
        symbol: "",
        side: "buy",
        amount: "",
        pnl: "",
        note: "",
      });
      setShowForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "添加失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("确定删除这条记录？")) return;
    const res = await fetch(`/api/me/results/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setResults((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <section className="rounded border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">交易成绩</h2>
        <div className="text-sm font-medium">
          汇总盈亏：<span className={totalPnl >= 0 ? "text-[var(--profit)]" : "text-[var(--loss)]"}>{totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)}</span>
        </div>
      </div>
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mb-4 rounded bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-[var(--accent-hover)]"
        >
          添加记录
        </button>
      ) : (
        <form onSubmit={handleAdd} className="mb-6 grid gap-3 rounded border border-[var(--border)] bg-slate-50/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-0.5 block text-xs font-medium text-[var(--text-muted)]">日期</label>
            <input
              type="date"
              value={form.tradeDate}
              onChange={(e) => setForm((f) => ({ ...f, tradeDate: e.target.value }))}
              className="w-full rounded border border-[var(--border)] bg-white px-2 py-1.5 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium text-[var(--text-muted)]">标的/代码</label>
            <input
              type="text"
              value={form.symbol}
              onChange={(e) => setForm((f) => ({ ...f, symbol: e.target.value }))}
              placeholder="如 600519"
              className="w-full rounded border border-[var(--border)] bg-white px-2 py-1.5 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium text-[var(--text-muted)]">买卖</label>
            <select
              value={form.side}
              onChange={(e) => setForm((f) => ({ ...f, side: e.target.value }))}
              className="w-full rounded border border-[var(--border)] bg-white px-2 py-1.5 text-sm focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="buy">买入</option>
              <option value="sell">卖出</option>
            </select>
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium text-[var(--text-muted)]">金额</label>
            <input
              type="number"
              step="any"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="可选"
              className="w-full rounded border border-[var(--border)] bg-white px-2 py-1.5 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs font-medium text-[var(--text-muted)]">盈亏</label>
            <input
              type="number"
              step="any"
              value={form.pnl}
              onChange={(e) => setForm((f) => ({ ...f, pnl: e.target.value }))}
              placeholder="可选"
              className="w-full rounded border border-[var(--border)] bg-white px-2 py-1.5 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-0.5 block text-xs font-medium text-[var(--text-muted)]">备注</label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="w-full rounded border border-[var(--border)] bg-white px-2 py-1.5 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {loading ? "添加中…" : "保存"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-slate-50"
            >
              取消
            </button>
          </div>
        </form>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              <th className="py-2 pr-2">日期</th>
              <th className="py-2 pr-2">标的</th>
              <th className="py-2 pr-2">买卖</th>
              <th className="py-2 pr-2 text-right">金额</th>
              <th className="py-2 pr-2 text-right">盈亏</th>
              <th className="py-2 pr-2">备注</th>
              <th className="w-12 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-center text-[var(--text-muted)]">
                  暂无记录
                </td>
              </tr>
            ) : (
              results.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)]">
                  <td className="py-2 pr-2 text-[var(--text-secondary)]">{new Date(r.tradeDate as string).toLocaleDateString("zh-CN")}</td>
                  <td className="py-2 pr-2 font-medium">{r.symbol || "—"}</td>
                  <td className="py-2 pr-2">{r.side === "buy" ? "买" : r.side === "sell" ? "卖" : "—"}</td>
                  <td className="py-2 pr-2 text-right">{r.amount != null ? r.amount : "—"}</td>
                  <td className={`py-2 pr-2 text-right font-medium ${r.pnl != null && r.pnl >= 0 ? "text-[var(--profit)]" : r.pnl != null ? "text-[var(--loss)]" : ""}`}>
                    {r.pnl != null ? (r.pnl >= 0 ? "+" : "") + r.pnl : "—"}
                  </td>
                  <td className="max-w-[120px] truncate py-2 pr-2 text-[var(--text-secondary)]">{r.note || "—"}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="text-xs text-[var(--danger)] hover:underline"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
