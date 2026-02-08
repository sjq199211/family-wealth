import { getSession as getSessionPayload } from "@/lib/session";
import { prisma } from "./db";

export type SessionUser = {
  id: number;
  name: string;
  role: string;
};

export async function getSession(): Promise<SessionUser | null> {
  const session = await getSessionPayload();
  if (!session?.gate) return null;
  if (session.memberId == null) {
    return { id: 0, name: "请选择身份", role: "member" };
  }
  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    select: { id: true, name: true, role: true },
  });
  if (!member) return { id: 0, name: "请选择身份", role: "member" };
  return { id: member.id, name: member.name, role: member.role };
}

export async function clearSession(): Promise<void> {
  const { clearSession: clear } = await import("@/lib/session");
  await clear();
}

export function isWeeklyReporter(role: string): boolean {
  return role === "weekly_reporter";
}
