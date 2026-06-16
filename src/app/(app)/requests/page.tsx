"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedirectInner() {
  const router = useRouter();
  const open = useSearchParams().get("open");
  useEffect(() => {
    router.replace(`/my-listings?tab=requests${open ? `&open=${open}` : ""}`);
  }, [router, open]);
  return null;
}

export default function RequestsRedirect() {
  return (
    <Suspense fallback={null}>
      <RedirectInner />
    </Suspense>
  );
}
