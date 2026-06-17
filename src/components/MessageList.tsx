"use client";

import ChatBubble from "@/components/ChatBubble";
import { cn } from "@/lib/utils";
import type { MessageContentType } from "@/lib/types";

// Normalized message shape so DMs, group, and world chat share one renderer.
export interface ChatMsg {
  id: string;
  authorId: string;
  authorEmail: string;
  content: string;
  contentType: MessageContentType;
  filename?: string;
  createdAt: string;
  replyToAuthor?: string;
  replyToPreview?: string;
}

const GROUP_WINDOW_MS = 5 * 60 * 1000; // group same-author messages within 5 min

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  if (same(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function MessageList({
  messages,
  currentUserId,
  showAuthors = true,
  onReply,
  myHandle,
}: {
  messages: ChatMsg[];
  currentUserId: string;
  showAuthors?: boolean;
  onReply?: (m: ChatMsg) => void;
  myHandle?: string;
}) {
  return (
    <>
      {messages.map((m, i) => {
        const prev = messages[i - 1];
        const newDay =
          !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
        const continuation =
          !newDay &&
          !!prev &&
          prev.authorId === m.authorId &&
          !m.replyToPreview &&
          new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < GROUP_WINDOW_MS;
        return (
          <div key={m.id}>
            {newDay && (
              <div className="my-3 flex items-center gap-3">
                <div className="h-px flex-1 bg-line" />
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  {dayLabel(m.createdAt)}
                </span>
                <div className="h-px flex-1 bg-line" />
              </div>
            )}
            <div className={cn(continuation ? "mt-0.5" : "mt-3", "first:mt-0")}>
              <ChatBubble
                email={m.authorEmail}
                content={m.content}
                contentType={m.contentType}
                filename={m.filename}
                createdAt={m.createdAt}
                mine={m.authorId === currentUserId}
                showAuthor={showAuthors}
                continuation={continuation}
                replyToAuthor={m.replyToAuthor}
                replyToPreview={m.replyToPreview}
                onReply={onReply ? () => onReply(m) : undefined}
                myHandle={myHandle}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}
