import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "reports");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_FILE = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });
  if (!user.id) return Response.json({ error: "请先在导航栏选择身份" }, { status: 400 });

  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) return Response.json({ error: "无效ID" }, { status: 400 });

  const report = await prisma.report.findFirst({ where: { id } });
  if (!report) return Response.json({ error: "研报不存在" }, { status: 404 });
  if (report.memberId !== user.id) {
    return Response.json({ error: "只能为自己的研报上传附件" }, { status: 403 });
  }

  const formData = await request.formData();
  const files = formData.getAll("file") as File[];
  if (!files.length) return Response.json({ error: "请选择文件" }, { status: 400 });

  const dir = path.join(UPLOAD_DIR, String(id));
  await mkdir(dir, { recursive: true });

  const created: { id: number; type: string; originalName: string }[] = [];

  for (const file of files) {
    if (!file.size || file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "文件大小超过 10MB 或为空" }, { status: 400 });
    }
    const mime = file.type;
    const isImage = ALLOWED_IMAGE.includes(mime);
    const isFile = ALLOWED_FILE.includes(mime);
    if (!isImage && !isFile) {
      return Response.json({ error: `不支持的文件类型: ${mime}` }, { status: 400 });
    }
    const ext = path.extname(file.name) || (isImage ? ".jpg" : ".pdf");
    const basename = `${randomUUID()}${ext}`;
    const filePath = path.join(dir, basename);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buf);
    const relPath = path.join("reports", String(id), basename);
    const attachment = await prisma.reportAttachment.create({
      data: {
        reportId: id,
        type: isImage ? "image" : "file",
        filePath: relPath,
        originalName: file.name,
      },
    });
    created.push({ id: attachment.id, type: attachment.type, originalName: attachment.originalName });
  }

  return Response.json({ ok: true, attachments: created });
}
