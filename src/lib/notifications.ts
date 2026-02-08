import { prisma } from "./db";
import type { SourceType } from "./sourceUrl";

/**
 * 根据内容中的 @ 提及创建通知（排除作者自己）
 */
export async function createMentionNotifications(
  fromMemberId: number,
  sourceType: SourceType,
  sourceId: number,
  message: string,
  contentWithMentions: string
): Promise<void> {
  const { parseMentionedMemberIds } = await import("./mentions");
  const ids = parseMentionedMemberIds(contentWithMentions);
  const toIds = ids.filter((id) => id !== fromMemberId);
  if (toIds.length === 0) return;
  await prisma.notification.createMany({
    data: toIds.map((toMemberId) => ({
      toMemberId,
      fromMemberId,
      sourceType,
      sourceId,
      message,
    })),
  });
}

export { getSourceUrl } from "./sourceUrl";
