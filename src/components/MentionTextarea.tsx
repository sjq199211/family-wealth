"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Member = { id: number; name: string };

export default function MentionTextarea({
  value,
  onChange,
  placeholder,
  rows = 4,
  members,
  className = "",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  members: Member[];
  className?: string;
  disabled?: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerFilter, setPickerFilter] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredMembers = pickerFilter
    ? members.filter((m) => m.name.includes(pickerFilter))
    : members;

  const insertMention = useCallback(
    (member: Member) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const before = value.slice(0, cursorPosition);
      const after = value.slice(cursorPosition);
      const token = `@[${member.id}:${member.name}]`;
      const newValue = before + token + after;
      onChange(newValue);
      setShowPicker(false);
      setPickerFilter("");
      setTimeout(() => {
        ta.focus();
        const pos = before.length + token.length;
        ta.setSelectionRange(pos, pos);
      }, 0);
    },
    [value, cursorPosition, onChange, members]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    const pos = e.target.selectionStart ?? 0;
    onChange(v);
    setCursorPosition(pos);

    const textBeforeCaret = v.slice(0, pos);
    const lastAt = textBeforeCaret.lastIndexOf("@");
    if (lastAt !== -1) {
      const between = textBeforeCaret.slice(lastAt + 1);
      if (!/\[?\d+:/.test(between) && !between.includes("]")) {
        setPickerFilter(between);
        setShowPicker(true);
        return;
      }
    }
    setShowPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showPicker) return;
    if (e.key === "Escape") {
      setShowPicker(false);
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (!showPicker) return;
    const handler = () => setShowPicker(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showPicker]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={className}
      />
      {showPicker && filteredMembers.length > 0 && (
        <ul
          className="absolute z-50 mt-1 max-h-48 w-56 overflow-auto rounded border border-[var(--border)] bg-[var(--bg-card)] py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {filteredMembers.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                onClick={() => insertMention(m)}
              >
                @{m.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
