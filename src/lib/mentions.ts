/**
 * 解析内容中的 @[id:name] 提及，返回被 @ 的成员 id 列表（去重）
 */
const MENTION_REGEX = /@\[(\d+):[^\]]+\]/g;

export function parseMentionedMemberIds(text: string): number[] {
  if (!text || typeof text !== "string") return [];
  const ids = new Set<number>();
  let m: RegExpExecArray | null;
  MENTION_REGEX.lastIndex = 0;
  while ((m = MENTION_REGEX.exec(text)) !== null) {
    ids.add(parseInt(m[1], 10));
  }
  return Array.from(ids);
}

/**
 * 将内容中的 @[id:name] 转为可展示的 HTML 或保留原文供前端渲染
 * 前端用组件渲染时可用此得到片段数组
 */
export function getMentionFragments(text: string): { type: "text" | "mention"; value: string; memberId?: number }[] {
  if (!text || typeof text !== "string") return [];
  const parts: { type: "text" | "mention"; value: string; memberId?: number }[] = [];
  let lastEnd = 0;
  let m: RegExpExecArray | null;
  MENTION_REGEX.lastIndex = 0;
  while ((m = MENTION_REGEX.exec(text)) !== null) {
    if (m.index > lastEnd) {
      parts.push({ type: "text", value: text.slice(lastEnd, m.index) });
    }
    parts.push({ type: "mention", value: m[0].replace(/^@\[(\d+):([^\]]+)\]$/, "$2"), memberId: parseInt(m[1], 10) });
    lastEnd = m.index + m[0].length;
  }
  if (lastEnd < text.length) {
    parts.push({ type: "text", value: text.slice(lastEnd) });
  }
  return parts.length ? parts : [{ type: "text", value: text }];
}
