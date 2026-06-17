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
}: {
  email: string;
  content: string;
  contentType: MessageContentType;
  filename?: string;
  createdAt: string;
  mine: boolean;
  showAuthor?: boolean;
  continuation?: boolean;
}) {
  const hasHeader = showAuthor && !mine && !continuation;
  return (
    <div className={cn("flex gap-2", mine && "flex-row-reverse")}>
      {!mine &&
        (continuation ? (
          <div className="w-8 shrink-0" />
        ) : (
          <Avatar email={email} size={32} className={cn(hasHeader ? "mt-4" : "mt-0")} />
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
              : "rounded-bl-sm bg-white text-ink shadow-sm ring-1 ring-line"
          )}
        >
          {contentType === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={content} alt={filename ?? "photo"} loading="lazy" decoding="async" className="max-h-56 rounded-lg" />
          ) : contentType === "attachment" ? (
            <span className="inline-flex items-center gap-1">📎 {filename ?? "attachment"}</span>
          ) : (
            <MessageText content={content} mine={mine} />
          )}
        </div>
        {!continuation && <p className="mt-0.5 text-[10px] text-slate-400">{formatTime(createdAt)}</p>}
      </div>
    </div>
  );
}
