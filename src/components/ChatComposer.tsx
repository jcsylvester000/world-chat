"use client";

import { useState } from "react";
import EmojiPicker from "@/components/EmojiPicker";
import { fileToDataUrl } from "@/lib/utils";
import type { MessageContentType } from "@/lib/types";

// Shared message composer: text + emoji + photo. Used by DMs, group
// chat and world chat.
export default function ChatComposer({
  onSend,
  placeholder = "Type a message…",
}: {
  onSend: (
    content: string,
    opts?: { contentType?: MessageContentType; filename?: string }
  ) => void | Promise<void>;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const sendText = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    try {
      await onSend(text);
    } catch {
      setDraft(text); // restore the message so it isn't lost
    }
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = await fileToDataUrl(file);
    await onSend(url, { contentType: "image", filename: file.name });
  };

  return (
    <div className="relative flex items-center gap-2 border-t border-line p-3">
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
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPhoto}
        />
      </label>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyUp={(e) => e.key === "Enter" && sendText()}
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
  );
}
