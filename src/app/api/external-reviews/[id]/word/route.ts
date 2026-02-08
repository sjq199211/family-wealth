import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readFile, mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "external-reviews");

const ALLOWED_EXT = [".txt", ".doc", ".docx", ".pdf"];
const MIME_BY_EXT: Record<string, string> = {
  ".txt": "text/plain; charset=utf-8",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pdf": "application/pdf",
};

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) return Response.json({ error: "无效ID" }, { status: 400 });

  const row = await prisma.externalReview.findFirst({
    where: { id },
    select: { wordFilePath: true, wordFileName: true },
  });
  if (!row?.wordFilePath) return Response.json({ error: "暂无原文文件" }, { status: 404 });

  const fullPath = path.join(process.cwd(), row.wordFilePath);
  try {
    const buf = await readFile(fullPath);
    const name = row.wordFileName ? encodeURIComponent(row.wordFileName) : "原文" + path.extname(row.wordFilePath);
    return new Response(buf, {
      headers: {
        "Content-Disposition": `attachment; filename*=UTF-8''${name}`,
        "Content-Type": getContentType(row.wordFilePath),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return Response.json({ error: "文件不存在" }, { status: 404 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) return Response.json({ error: "无效ID" }, { status: 400 });

  const existing = await prisma.externalReview.findFirst({ where: { id } });
  if (!existing || existing.memberId !== user.id) {
    return Response.json({ error: "记录不存在或无权编辑" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return Response.json({ error: "请选择文件（支持 txt、doc、docx、pdf）" }, { status: 400 });
  }
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) {
    return Response.json({ error: "仅支持 .txt、.doc、.docx、.pdf 格式" }, { status: 400 });
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const relativePath = `uploads/external-reviews/${id}${ext}`;
    const fullPath = path.join(process.cwd(), relativePath);
    if (existing.wordFilePath && existing.wordFilePath !== relativePath) {
      const oldPath = path.join(process.cwd(), existing.wordFilePath);
      try { await unlink(oldPath); } catch { /* ignore */ }
    }
    const bytes = await file.arrayBuffer();
    await writeFile(fullPath, Buffer.from(bytes));

    await prisma.externalReview.update({
      where: { id },
      data: {
        wordFilePath: relativePath,
        wordFileName: file.name,
        aiSummary: null,
        aiRecommendedSymbols: null,
      },
    });

    return Response.json({ ok: true, fileName: file.name });
  } catch (e) {
    console.error("Word upload error:", e);
    const message = e instanceof Error ? e.message : "上传失败，请检查服务器目录权限或磁盘空间";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) return Response.json({ error: "无效ID" }, { status: 400 });

  const existing = await prisma.externalReview.findFirst({ where: { id } });
  if (!existing || existing.memberId !== user.id) {
    return Response.json({ error: "记录不存在或无权编辑" }, { status: 404 });
  }
  if (existing.wordFilePath) {
    const fullPath = path.join(process.cwd(), existing.wordFilePath);
    try { await unlink(fullPath); } catch { /* ignore */ }
  }
  await prisma.externalReview.update({
    where: { id },
    data: { wordFilePath: null, wordFileName: null, aiSummary: null, aiRecommendedSymbols: null },
  });
  return Response.json({ ok: true });
}
