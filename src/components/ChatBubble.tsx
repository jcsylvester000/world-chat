"use client";

import Avatar from "@/components/ui/Avatar";
import MessageText from "@/components/MessageText";
import { cn, displayName, formatTime } from "@/lib/utils";
import type { MessageContentType } from "@/lib/types";

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
}) {
  const hasHeader = showAuthor && !mine && !continuation;
  const mentionsMe =
    !mine &&
    !!myHandle &&
    contentType === "text" &&
    new RegExp(`@${myHandle.replace(/\./g, "\\.")}\\b`, "i").test(content);
  return (
    <div className={cn("group flex items-center gap-2", mine && "flex-row-reverse")}>
      {!mine &&
        (continuation ? (
          <div className="w-8 shrink-0" />
        ) : (
          <Avatar email={email} size={32} className={cn("self-end", hasHeader ? "mb-4" : "")} />
        ))}
      <div className={cn("max-w-[75%]", mine && "items-end text-right")}>
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
        {!continuation && <p className="mt-0.5 text-[10px] text-slate-400">{formatTime(createdAt)}</p>}
      </div>
      {onReply && (
        <button
          onClick={onReply}
          className="shrink-0 rounded-full px-1.5 py-0.5 text-sm text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-ink group-hover:opacity-100"
          title="Reply"
          type="button"
        >
          ↩
        </button>
      )}
    </div>
  );
}
