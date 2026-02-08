import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractTextFromFile } from "@/lib/extractFileText";
import { readFile } from "fs/promises";
import path from "path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return Response.json({ error: "未登录" }, { status: 401 });

  const id = parseInt((await params).id, 10);
  if (Number.isNaN(id)) return Response.json({ error: "无效ID" }, { status: 400 });

  const row = await prisma.externalReview.findFirst({ where: { id } });
  if (!row) return Response.json({ error: "记录不存在" }, { status: 404 });

  let text = "";
  if (row.wordFilePath) {
    const fullPath = path.join(process.cwd(), row.wordFilePath);
    try {
      const buf = await readFile(fullPath);
      text = await extractTextFromFile(row.wordFilePath, buf);
    } catch (e) {
      console.error("file extract error:", e);
      const err = e as NodeJS.ErrnoException;
      const msg =
        err?.code === "ENOENT"
          ? "原文文件不存在，请重新上传"
          : "原文解析失败，请尝试重新上传该文件或改为上传 txt/pdf 格式";
      return Response.json({ error: msg }, { status: 400 });
    }
  }
  if (!text && row.body) text = row.body.trim();
  if (!text) return Response.json({ error: "请先上传原文文件（txt/doc/docx/pdf）或填写内容后再生成总结" }, { status: 400 });

  if (!OPENAI_API_KEY) {
    return Response.json({ error: "未配置 OPENAI_API_KEY，无法使用 AI 总结" }, { status: 503 });
  }

  const systemPrompt = `你是一位专业资料摘要助手。请对用户提供的资料原文进行简洁总结。
输出要求（严格按以下格式，使用中文）：
1. 先输出「## 重点总结」，然后列出 3～8 条重点，每条一行，简短清晰。
2. 再输出「## 推荐标的」，列出文中明确推荐的 A 股/基金名称，每行一个。若知道代码则写：名称(代码)，如立讯精密(002475)；若不知道代码则写：名称 (无代码)，系统会自动补全代码。若文中没有明确推荐标的，则写「无」。`;

  const userPrompt = `请总结以下资料原文：\n\n${text.slice(0, 12000)}`;

  let summaryText: string;
  try {
    const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });
    const errText = await res.text();
    if (!res.ok) {
      console.error("AI API error:", res.status, errText);
      let msg = "AI 服务调用失败";
      if (res.status === 401) msg = "API Key 无效或已过期，请检查 .env 中的 OPENAI_API_KEY";
      else if (res.status === 404) msg = "模型不存在，请检查 .env 中的 OPENAI_MODEL 或 OPENAI_BASE_URL";
      else if (res.status === 429) msg = "请求过于频繁或余额不足，请稍后再试";
      else if (errText) {
        try {
          const errJson = JSON.parse(errText) as { error?: { message?: string } };
          if (errJson?.error?.message) msg = errJson.error.message;
        } catch {
          if (errText.length < 200) msg = errText;
        }
      }
      return Response.json({ error: msg }, { status: 502 });
    }
    const data = JSON.parse(errText) as { choices?: { message?: { content?: string } }[] };
    summaryText = data.choices?.[0]?.message?.content?.trim() || "";
  } catch (e) {
    console.error("OpenAI request error:", e);
    const msg = e instanceof Error ? e.message : "网络或服务异常";
    return Response.json({ error: `AI 服务请求失败：${msg}` }, { status: 502 });
  }

  const recommendedSection = summaryText.includes("## 推荐标的")
    ? summaryText.split("## 推荐标的")[1]?.trim().split("\n").map((s) => s.trim()).filter(Boolean) || []
    : [];
  const recommendedRaw = recommendedSection
    .filter((s) => s !== "无" && s.length > 0)
    .slice(0, 50);
  const stripCode = (s: string) => s.replace(/\s*[（(][^）)]*[）)]\s*$/, "").trim() || s;
  const recommendedNames = recommendedRaw.map(stripCode);
  let aiSummary = summaryText;
  if (recommendedNames.length > 0 && summaryText.includes("## 推荐标的")) {
    const parts = summaryText.split("## 推荐标的");
    aiSummary = parts[0] + "## 推荐标的\n" + recommendedNames.join("\n");
  }
  const aiRecommendedSymbols = JSON.stringify(recommendedNames);

  await prisma.externalReview.update({
    where: { id },
    data: { aiSummary, aiRecommendedSymbols },
  });

  return Response.json({
    ok: true,
    aiSummary,
    recommendedSymbols: recommendedNames,
  });
}
