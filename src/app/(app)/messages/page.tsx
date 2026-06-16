"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ChatPanel from "@/components/ChatPanel";

function MessagesInner() {
  const to = useSearchParams().get("to");
  return (
    <div className="mx-auto h-[calc(100dvh-4rem)] max-w-3xl p-3 sm:p-4">
      <ChatPanel openDmUserId={to} defaultTab="direct" />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesInner />
    </Suspense>
  );
}
