import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return Response.json({ user: null });
  return Response.json({ user: { id: user.id, name: user.name, role: user.role } });
}
