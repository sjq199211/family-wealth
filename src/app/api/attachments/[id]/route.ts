import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) return Response.json({ error: "无效ID" }, { status: 400 });

  const att = await prisma.reportAttachment.findFirst({
    where: { id },
    include: { report: { select: { memberId: true } } },
  });
  if (!att) return Response.json({ error: "附件不存在" }, { status: 404 });

  const fullPath = path.join(UPLOAD_DIR, att.filePath);
  try {
    const buf = await readFile(fullPath);
    const name = encodeURIComponent(att.originalName);
    const url = new URL(_request.url);
    const inline = url.searchParams.get("preview") === "1" && att.type === "image";
    const ext = path.extname(att.filePath).toLowerCase();
    const mime: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp" };
    const contentType = att.type === "image" ? (mime[ext] ?? "image/jpeg") : undefined;
    return new Response(buf, {
      headers: {
        "Content-Disposition": inline ? "inline" : `attachment; filename*=UTF-8''${name}`,
        "Cache-Control": "private, max-age=3600",
        ...(contentType && { "Content-Type": contentType }),
      },
    });
  } catch {
    return Response.json({ error: "文件不存在" }, { status: 404 });
  }
}
