import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import TradingNotesSection from "./TradingNotesSection";
import TradingResultsSection from "./TradingResultsSection";

export default async function MePage() {
  const user = await getSession();
  if (!user) return null;

  let notes: Awaited<ReturnType<typeof prisma.tradingNote.findMany<{
    include: { member: { select: { name: true } }; likes: { select: { memberId: true } }; comments: { orderBy: { createdAt: "asc" }; include: { member: { select: { name: true } } } } };
  }>>>;
  let results: Awaited<ReturnType<typeof prisma.tradingResult.findMany>>;
  try {
    [notes, results] = await Promise.all([
      prisma.tradingNote.findMany({
        orderBy: { noteDate: "desc" },
        include: {
          member: { select: { name: true } },
          likes: { select: { memberId: true } },
          comments: { orderBy: { createdAt: "asc" }, include: { member: { select: { name: true } } } },
        },
      }),
      prisma.tradingResult.findMany({
        where: { memberId: user.id },
        orderBy: { tradeDate: "desc" },
      }),
    ]);
  } catch (e) {
    console.error("Me page load error:", e);
    return (
      <div className="rounded border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
        <p className="font-medium">加载失败</p>
        <p className="mt-1 text-sm">请确认已执行数据库迁移：在项目目录运行 <code className="rounded bg-black/10 px-1">npx prisma db push</code></p>
      </div>
    );
  }

  const notesForClient = notes.map((n) => ({
    id: n.id,
    memberId: n.memberId,
    memberName: n.member?.name ?? "未知",
    content: n.content,
    noteDate: n.noteDate.toISOString(),
    createdAt: n.createdAt.toISOString(),
    likeCount: n.likes.length,
    likedByMe: user.id !== 0 && n.likes.some((l) => l.memberId === user.id),
    comments: n.comments.map((c) => ({
      id: c.id,
      memberId: c.memberId,
      memberName: c.member?.name ?? "未知",
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
  }));
  const resultsForClient = results.map((r) => ({
    id: r.id,
    tradeDate: r.tradeDate.toISOString(),
    symbol: r.symbol,
    side: r.side,
    amount: r.amount,
    pnl: r.pnl,
    note: r.note,
  }));

  const members = await prisma.member.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">个人空间</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">交易心得与成绩仅本人可见，心得支持 @ 成员</p>
      </div>

      <TradingNotesSection initialNotes={notesForClient} members={members} currentUserId={user.id} />
      <TradingResultsSection initialResults={resultsForClient} />
    </div>
  );
}
