import Link from "next/link";
import { getSession } from "@/lib/auth";

const sections = [
  { href: "/weekly", label: "每周复盘与展望", desc: "主要由基金经理发布每周复盘与展望" },
  { href: "/stock-strategies", label: "个股交易策略", desc: "设定止损价、止盈价、操作难度与趋势点评" },
  { href: "/me", label: "个人交易心得", desc: "记录心得，支持 @ 成员" },
  { href: "/external-reviews", label: "外部资料", desc: "分享外部研报与资料" },
];

export default async function HomePage() {
  const user = await getSession();
  if (!user) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">首页</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map(({ href, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="block rounded border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm transition hover:border-[var(--accent)]/50 hover:shadow-md"
          >
            <h2 className="font-medium text-[var(--text-primary)]">{label}</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
