"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSourceUrl } from "@/lib/sourceUrl";

type User = { id: number; name: string; role: string };
type NotificationItem = {
  id: number;
  message: string;
  sourceType: string;
  sourceId: number;
  readAt: string | null;
  createdAt: string;
  fromMember: { name: string };
};

export default function MainNav({
  user,
  members,
}: {
  user: User;
  members: { id: number; name: string; role: string }[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [identityOpen, setIdentityOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setNotifications(data.list);
    setUnreadCount(data.unreadCount);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/gate");
    router.refresh();
  }

  async function selectIdentity(memberId: number) {
    await fetch("/api/identity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    setIdentityOpen(false);
    router.refresh();
  }

  async function markNotifRead(id: number, sourceType: string, sourceId: number) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    setNotifOpen(false);
    router.push(getSourceUrl(sourceType as import("@/lib/sourceUrl").SourceType, sourceId));
  }

  const nav = [
    { href: "/weekly", label: "每周复盘与展望" },
    { href: "/stock-strategies", label: "个股交易策略" },
    { href: "/me", label: "个人交易心得" },
    { href: "/external-reviews", label: "外部资料" },
  ];

  return (
    <nav className="bg-[var(--bg-nav)] border-b border-slate-800/50 px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-sm font-semibold tracking-tight text-[var(--accent-muted)]">
            家庭财富
          </Link>
          <div className="flex gap-6">
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium tracking-wide ${
                  pathname === href || (href !== "/" && pathname.startsWith(href))
                    ? "text-[var(--accent-muted)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((v) => !v);
                if (!notifOpen) loadNotifications();
              }}
              className="relative rounded p-1.5 text-slate-400 hover:text-white"
              title="提醒"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-xs font-medium text-slate-900">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-80 rounded border border-slate-700 bg-slate-900 py-2 shadow-xl">
                  <div className="border-b border-slate-700 px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    提醒
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-slate-500">暂无提醒</p>
                  ) : (
                    <ul className="max-h-72 overflow-auto">
                      {notifications.map((n) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-800 ${!n.readAt ? "bg-slate-800/50" : ""}`}
                            onClick={() => markNotifRead(n.id, n.sourceType, n.sourceId)}
                          >
                            <span className="text-slate-300">{n.message}</span>
                            <span className="ml-1 text-xs text-slate-500">{n.fromMember.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIdentityOpen((v) => !v)}
              className="text-sm text-slate-300 hover:text-white"
            >
              {user.name} ▾
            </button>
            {identityOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIdentityOpen(false)} />
                <ul className="absolute right-0 top-full z-20 mt-1 w-44 rounded border border-slate-700 bg-slate-900 py-1 shadow-xl">
                  {members.length === 0 ? (
                    <li className="px-3 py-3 text-sm text-slate-500">暂无成员，请执行 npm run db:seed</li>
                  ) : (
                    members.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => selectIdentity(m.id)}
                          className={`block w-full px-3 py-2 text-left text-sm ${
                            user.id === m.id ? "bg-slate-800 text-[var(--accent-muted)] font-medium" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          {m.name}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-slate-300"
          >
            退出
          </button>
        </div>
      </div>
    </nav>
  );
}
