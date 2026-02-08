import path from "path";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import WordExtractor from "word-extractor";

const docExtractor = new WordExtractor();

/**
 * 从上传的原文文件（txt/doc/docx/pdf）中提取纯文本，用于展示或 AI 总结。
 */
export async function extractTextFromFile(filePath: string, buf: Buffer): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".txt") {
    return buf.toString("utf-8").trim();
  }
  if (ext === ".pdf") {
    const parser = new PDFParse({ data: buf });
    try {
      const result = await parser.getText();
      await parser.destroy();
      return (result?.text ?? "").trim();
    } finally {
      try {
        await parser.destroy();
      } catch {
        /* ignore */
      }
    }
  }
  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ buffer: buf });
    return result.value?.trim() || "";
  }
  if (ext === ".doc") {
    const doc = await docExtractor.extract(buf);
    const body = doc.getBody();
    return (body ?? "").trim();
  }
  return "";
}
