"use client";

import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import MessageText from "@/components/MessageText";
import { cn, displayName, formatTime } from "@/lib/utils";
import type { MessageContentType, Reaction } from "@/lib/types";

const QUICK = ["👍", "❤️", "😂", "🎉", "😮", "😢"];

export default function ChatBubble({
  email,
  content,
  contentType,
  filename,
  createdAt,
  mine,
  showAuthor = true,
  continuation = false,
  replyToAuthor,
  replyToPreview,
  onReply,
  myHandle,
  currentUserId,
  reactions,
  onReact,
}: {
  email: string;
  content: string;
  contentType: MessageContentType;
  filename?: string;
  createdAt: string;
  mine: boolean;
  showAuthor?: boolean;
  continuation?: boolean;
  replyToAuthor?: string;
  replyToPreview?: string;
  onReply?: () => void;
  myHandle?: string;
  currentUserId?: string;
  reactions?: Reaction[];
  onReact?: (emoji: string) => void;
}) {
  const [pickOpen, setPickOpen] = useState(false);
  const hasHeader = showAuthor && !mine && !continuation;
  const mentionsMe =
    !mine &&
    !!myHandle &&
    contentType === "text" &&
    new RegExp(`@${myHandle.replace(/\./g, "\\.")}\\b`, "i").test(content);

  // group reactions by emoji → { count, mine }
  const byEmoji = new Map<string, { count: number; mine: boolean }>();
  for (const r of reactions ?? []) {
    const e = byEmoji.get(r.emoji) ?? { count: 0, mine: false };
    e.count++;
    if (r.userId === currentUserId) e.mine = true;
    byEmoji.set(r.emoji, e);
  }
  const react = (emoji: string) => {
    onReact?.(emoji);
    setPickOpen(false);
  };

  return (
    <div className={cn("group flex items-center gap-2", mine && "flex-row-reverse")}>
      {!mine &&
        (continuation ? (
          <div className="w-8 shrink-0" />
        ) : (
          <Avatar email={email} size={32} className={cn("self-end", hasHeader ? "mb-4" : "")} />
        ))}
      <div className={cn("flex max-w-[75%] flex-col", mine && "items-end text-right")}>
        {hasHeader && (
          <p className="mb-0.5 text-xs font-medium text-slate-500">{displayName(email)}</p>
        )}
        <div
          className={cn(
            "inline-block rounded-2xl px-3 py-2 text-left text-sm",
            mine
              ? "rounded-br-sm bg-primary text-white"
              : "rounded-bl-sm bg-white text-ink shadow-sm ring-1 ring-line",
            mentionsMe && "bg-amber-50 ring-amber-300"
          )}
        >
          {replyToPreview && (
            <div
              className={cn(
                "mb-1 rounded-md border-l-2 px-2 py-1 text-xs",
                mine ? "border-white/60 bg-white/15" : "border-primary bg-primary-50/60 text-slate-600"
              )}
            >
              <span className={cn("font-medium", mine ? "text-white" : "text-primary")}>
                {replyToAuthor ? displayName(replyToAuthor) : "Reply"}
              </span>
              <span className="ml-1 opacity-80">{replyToPreview}</span>
            </div>
          )}
          {contentType === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={content} alt={filename ?? "photo"} loading="lazy" decoding="async" className="max-h-56 rounded-lg" />
          ) : contentType === "attachment" ? (
            <span className="inline-flex items-center gap-1">📎 {filename ?? "attachment"}</span>
          ) : (
            <MessageText content={content} mine={mine} myHandle={myHandle} />
          )}
        </div>

        {byEmoji.size > 0 && (
          <div className={cn("mt-1 flex flex-wrap gap-1", mine && "justify-end")}>
            {[...byEmoji.entries()].map(([emoji, info]) => (
              <button
                key={emoji}
                onClick={() => onReact?.(emoji)}
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs transition",
                  info.mine
                    ? "border-primary bg-primary-50 text-primary"
                    : "border-line bg-white text-slate-600 hover:bg-slate-50"
                )}
                title="Toggle reaction"
              >
                <span>{emoji}</span>
                <span>{info.count}</span>
              </button>
            ))}
          </div>
        )}

        {!continuation && <p className="mt-0.5 text-[10px] text-slate-400">{formatTime(createdAt)}</p>}
      </div>

      {(onReply || onReact) && (
        <div className="relative flex shrink-0 items-center gap-0.5 self-center opacity-0 transition group-hover:opacity-100">
          {onReact && (
            <button
              onClick={() => setPickOpen((v) => !v)}
              className="rounded-full px-1.5 py-0.5 text-sm text-slate-400 hover:bg-slate-100 hover:text-ink"
              title="Add reaction"
              type="button"
            >
              🙂
            </button>
          )}
          {onReply && (
            <button
              onClick={onReply}
              className="rounded-full px-1.5 py-0.5 text-sm text-slate-400 hover:bg-slate-100 hover:text-ink"
              title="Reply"
              type="button"
            >
              ↩
            </button>
          )}
          {pickOpen && onReact && (
            <div
              className={cn(
                "absolute bottom-full z-20 mb-1 flex gap-1 rounded-full border border-line bg-white px-2 py-1 shadow-lg",
                mine ? "left-0" : "right-0"
              )}
            >
              {QUICK.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => react(emoji)}
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded-full text-base transition hover:bg-slate-100"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
