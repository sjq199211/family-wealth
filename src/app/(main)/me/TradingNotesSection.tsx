"use client";

import { useState } from "react";
import MentionTextarea from "@/components/MentionTextarea";
import ContentWithMentions from "@/components/ContentWithMentions";

type Comment = { id: number; memberId: number; memberName: string; content: string; createdAt: string };
type Note = {
  id: number;
  memberId: number;
  memberName?: string;
  content: string;
  noteDate: Date | string;
  createdAt: Date | string;
  likeCount?: number;
  likedByMe?: boolean;
  comments?: Comment[];
};
type Member = { id: number; name: string };

export default function TradingNotesSection({
  initialNotes,
  members,
  currentUserId,
}: {
  initialNotes: Note[];
  members: Member[];
  currentUserId: number;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [content, setContent] = useState("");
  const [noteDate, setNoteDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [commentLoading, setCommentLoading] = useState<number | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/me/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), noteDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "添加失败");
      setNotes((prev) => [
        {
          id: data.id,
          memberId: data.memberId,
          memberName: members.find((m) => m.id === data.memberId)?.name,
          content: data.content,
          noteDate: data.noteDate,
          createdAt: data.createdAt,
          likeCount: 0,
          likedByMe: false,
          comments: [],
        },
        ...prev,
      ]);
      setContent("");
      setNoteDate(new Date().toISOString().slice(0, 10));
    } catch (err) {
      alert(err instanceof Error ? err.message : "添加失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleLike(noteId: number) {
    const res = await fetch(`/api/notes/${noteId}/like`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? {
              ...n,
              likeCount: (n.likeCount ?? 0) + (data.liked ? 1 : -1),
              likedByMe: data.liked,
            }
          : n
      )
    );
  }

  async function handleComment(noteId: number) {
    const text = commentInputs[noteId]?.trim();
    if (!text) return;
    setCommentLoading(noteId);
    try {
      const res = await fetch(`/api/notes/${noteId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "评论失败");
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? { ...n, comments: [...(n.comments ?? []), data] }
            : n
        )
      );
      setCommentInputs((prev) => ({ ...prev, [noteId]: "" }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "评论失败");
    } finally {
      setCommentLoading(null);
    }
  }

  async function handleDelete(noteId: number) {
    if (!confirm("确定删除这条心得？")) return;
    const res = await fetch(`/api/me/notes/${noteId}`, { method: "DELETE" });
    if (!res.ok) return;
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  function startEdit(n: Note) {
    setEditingId(n.id);
    setEditContent(n.content);
  }

  async function saveEdit() {
    if (editingId == null) return;
    const res = await fetch(`/api/me/notes/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent.trim() }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setNotes((prev) => prev.map((n) => (n.id === editingId ? { ...n, content: data.content } : n)));
    setEditingId(null);
  }

  return (
    <section className="rounded border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">交易心得</h2>
      <p className="mb-4 text-sm text-[var(--text-muted)]">大家的心得，可点赞与评论</p>
      <form onSubmit={handleAdd} className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <input
            type="date"
            value={noteDate}
            onChange={(e) => setNoteDate(e.target.value)}
            className="rounded border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <MentionTextarea
            value={content}
            onChange={setContent}
            placeholder="记录心得，输入 @ 提及成员…"
            rows={2}
            members={members}
            className="w-full rounded border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-medium text-slate-900 hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {loading ? "添加中…" : "添加"}
        </button>
      </form>
      <ul className="space-y-4">
        {notes.length === 0 ? (
          <li className="text-sm text-[var(--text-muted)]">暂无心得</li>
        ) : (
          notes.map((n) => (
            <li key={n.id} className="rounded border border-[var(--border)] p-3">
              {editingId === n.id ? (
                <>
                  <MentionTextarea
                    value={editContent}
                    onChange={setEditContent}
                    rows={2}
                    members={members}
                    className="mb-2 w-full rounded border border-[var(--border)] px-2 py-1 text-sm focus:border-[var(--accent)] focus:outline-none"
                  />
                  <div className="flex gap-1">
                    <button type="button" onClick={saveEdit} className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">保存</button>
                    <button type="button" onClick={() => setEditingId(null)} className="text-sm text-[var(--text-muted)] hover:underline">取消</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(n.noteDate as string).toLocaleDateString("zh-CN")}
                        {n.memberName && ` · ${n.memberName}`}
                      </span>
                      <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                        <ContentWithMentions text={n.content} />
                      </p>
                    </div>
                    {n.memberId === currentUserId && (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEdit(n)} className="text-xs text-[var(--text-muted)] hover:underline">编辑</button>
                        <button type="button" onClick={() => handleDelete(n.id)} className="text-xs text-[var(--danger)] hover:underline">删除</button>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleLike(n.id)}
                      className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--accent)]"
                    >
                      <span className={n.likedByMe ? "text-[var(--accent)]" : ""}>
                        {n.likedByMe ? "♥" : "♡"}
                      </span>
                      <span>{(n.likeCount ?? 0) > 0 ? n.likeCount : "点赞"}</span>
                    </button>
                  </div>
                  <div className="mt-3 border-t border-[var(--border)] pt-3">
                    {(n.comments ?? []).map((c) => (
                      <div key={c.id} className="mb-2 text-sm">
                        <span className="font-medium text-[var(--text-primary)]">{c.memberName}</span>
                        <span className="text-[var(--text-muted)]"> · {c.content}</span>
                        <span className="ml-1 text-xs text-[var(--text-muted)]">
                          {new Date(c.createdAt).toLocaleString("zh-CN")}
                        </span>
                      </div>
                    ))}
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={commentInputs[n.id] ?? ""}
                        onChange={(e) => setCommentInputs((prev) => ({ ...prev, [n.id]: e.target.value }))}
                        placeholder="写评论…"
                        className="flex-1 rounded border border-[var(--border)] px-2 py-1.5 text-sm focus:border-[var(--accent)] focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleComment(n.id);
                          }
                        }}
                      />
                      <button
                        type="button"
                        disabled={commentLoading === n.id}
                        onClick={() => handleComment(n.id)}
                        className="rounded bg-slate-100 px-2 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-slate-200 disabled:opacity-50"
                      >
                        {commentLoading === n.id ? "发送中…" : "发送"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
