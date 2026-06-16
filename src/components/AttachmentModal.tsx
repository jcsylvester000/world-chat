"use client";

import Modal from "./Modal";

// Previews a document attachment in an iframe, with a download link.
export default function AttachmentModal({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose} className="!max-w-5xl !h-[90vh] !p-0">
      <iframe src={url} title="Document preview" className="h-full w-full rounded-xl border-0" />
      <a
        href={url}
        download
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-4 right-4 rounded bg-brand-blue px-3 py-2 text-sm font-medium text-white shadow"
      >
        Download
      </a>
    </Modal>
  );
}
