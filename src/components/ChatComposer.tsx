"use client";

import { useRef, useState } from "react";
import EmojiPicker from "@/components/EmojiPicker";
import Avatar from "@/components/ui/Avatar";
import { fileToDataUrl, displayName } from "@/lib/utils";
import type { MessageContentType } from "@/lib/types";

export interface ReplyTarget {
  id: string;
  author: string; // email of the message being replied to
  preview: string; // short snippet shown in the banner + bubble
}

export interface MentionUser {
  id: string;
  username: string;
  email: string;
}

const TOKEN_RE = /(^|\s)@([A-Za-z0-9_.]*)$/;

// Shared message composer: text + emoji + photo + reply banner + @mention
// autocomplete. Used by DMs, group chat and world chat.
export default function ChatComposer({
  onSend,
  placeholder = "Type a message…",
  replyTarget,
  onCancelReply,
  mentionSource,
}: {
  onSend: (
    content: string,
    opts?: { contentType?: MessageContentType; filename?: string }
  ) => void | Promise<void>;
  placeholder?: string;
  replyTarget?: ReplyTarget | null;
  onCancelReply?: () => void;
  mentionSource?: (query: string) => Promise<MentionUser[]>;
}) {
  const [draft, setDraft] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [mentions, setMentions] = useState<MentionUser[]>([]);
  const [mIndex, setMIndex] = useState(0);
  const [mStart, setMStart] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const open = mStart !== null && mentions.length > 0;

  const closeMentions = () => {
    setMentions([]);
    setMStart(null);
    setMIndex(0);
  };

  const detectMention = async (value: string, caret: number) => {
    if (!mentionSource) return;
    const upto = value.slice(0, caret);
    const m = upto.match(TOKEN_RE);
    if (!m) return closeMentions();
    const query = m[2];
    setMStart(caret - query.length - 1); // index of the '@'
    setMIndex(0);
    const results = await mentionSource(query);
    setMentions(results.slice(0, 6));
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDraft(value);
    void detectMention(value, e.target.selectionStart ?? value.length);
  };

  const pickMention = (u: MentionUser) => {
    const caret = inputRef.current?.selectionStart ?? draft.length;
    const start = mStart ?? caret;
    const next = `${draft.slice(0, start)}@${u.username} ${draft.slice(caret)}`;
    setDraft(next);
    closeMentions();
    requestAnimationFrame(() => {
      const pos = start + u.username.length + 2;
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(pos, pos);
    });
  };

  const sendText = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    closeMentions();
    try {
      await onSend(text);
    } catch {
      setDraft(text); // restore the message so it isn't lost
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (open) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMIndex((i) => (i + 1) % mentions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMIndex((i) => (i - 1 + mentions.length) % mentions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        pickMention(mentions[mIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        closeMentions();
        return;
      }
    }
    if (e.key === "Enter") sendText();
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = await fileToDataUrl(file);
    await onSend(url, { contentType: "image", filename: file.name });
  };

  return (
    <div className="border-t border-line">
      {replyTarget && (
        <div className="flex items-center gap-2 border-b border-line bg-slate-50 px-3 py-1.5 text-xs">
          <span className="text-primary">↩</span>
          <span className="min-w-0 flex-1 truncate text-slate-500">
            Replying to <span className="font-medium text-ink">{displayName(replyTarget.author)}</span>
            {" — "}
            {replyTarget.preview}
          </span>
          <button
            onClick={onCancelReply}
            className="shrink-0 rounded px-1 text-slate-400 hover:text-ink"
            title="Cancel reply"
            type="button"
          >
            ✕
          </button>
        </div>
      )}
      <div className="relative flex items-center gap-2 p-3">
        {open && (
          <ul className="absolute bottom-full left-3 z-20 mb-1 w-64 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-lg">
            {mentions.map((u, i) => (
              <li key={u.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickMention(u);
                  }}
                  onMouseEnter={() => setMIndex(i)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                    i === mIndex ? "bg-primary-50" : "hover:bg-slate-50"
                  }`}
                >
                  <Avatar email={u.email} size={24} />
                  <span className="font-medium text-ink">@{u.username}</span>
                  <span className="ml-auto truncate text-xs text-slate-400">{u.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={() => setShowEmoji((v) => !v)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-lg hover:bg-slate-100"
          title="Emoji"
          type="button"
        >
          😊
        </button>
        <label
          className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full text-lg hover:bg-slate-100"
          title="Photo"
        >
          🖼️
          <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
        </label>
        <input
          ref={inputRef}
          value={draft}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="input !rounded-full"
        />
        <button
          onClick={sendText}
          disabled={!draft.trim()}
          className="btn-primary !rounded-full !px-4"
          type="button"
        >
          Send
        </button>
        {showEmoji && (
          <EmojiPicker
            onSelect={(emoji) => {
              setDraft((d) => d + emoji);
              setShowEmoji(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
