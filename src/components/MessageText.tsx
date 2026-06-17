"use client";

import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// Lightweight, XSS-safe markdown renderer for chat messages. Builds React
// nodes directly (no dangerouslySetInnerHTML). Supports a common subset:
// **bold**, *italic* / _italic_, `code`, ~~strike~~, [text](url), bare URLs,
// > blockquotes, - / * bullet lists, and ``` fenced code blocks.
const INLINE =
  /(`[^`]+`)|(\*\*[^*]+\*\*)|(~~[^~]+~~)|(\*[^*]+\*)|(_[^_]+_)|(\[[^\]]+\]\([^)]+\))|(https?:\/\/[^\s)]+)/g;

function inline(text: string, mine: boolean): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  const linkCls = cn("underline", mine ? "text-white" : "text-primary");
  while ((m = INLINE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("`")) {
      out.push(
        <code key={k++} className="rounded bg-black/10 px-1 font-mono text-[0.85em]">
          {tok.slice(1, -1)}
        </code>
      );
    } else if (tok.startsWith("**")) {
      out.push(<strong key={k++}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("~~")) {
      out.push(<s key={k++}>{tok.slice(2, -2)}</s>);
    } else if (tok.startsWith("*") || tok.startsWith("_")) {
      out.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    } else if (tok.startsWith("[")) {
      const mm = tok.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (mm)
        out.push(
          <a key={k++} href={mm[2]} target="_blank" rel="noopener noreferrer" className={linkCls}>
            {mm[1]}
          </a>
        );
    } else {
      out.push(
        <a key={k++} href={tok} target="_blank" rel="noopener noreferrer" className={cn(linkCls, "break-all")}>
          {tok}
        </a>
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function MessageText({ content, mine = false }: { content: string; mine?: boolean }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  const special = (l: string) => l.trim().startsWith("```") || l.startsWith("> ") || /^[-*] /.test(l);

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) buf.push(lines[i++]);
      i++;
      blocks.push(
        <pre key={key++} className="my-1 overflow-x-auto rounded-lg bg-black/15 p-2 font-mono text-[0.8em]">
          <code>{buf.join("\n")}</code>
        </pre>
      );
      continue;
    }
    if (line.startsWith("> ")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) buf.push(lines[i++].slice(2));
      blocks.push(
        <blockquote key={key++} className="my-1 border-l-2 border-current/40 pl-2 opacity-90">
          {buf.map((b, bi) => (
            <div key={bi}>{inline(b, mine)}</div>
          ))}
        </blockquote>
      );
      continue;
    }
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) items.push(lines[i++].slice(2));
      blocks.push(
        <ul key={key++} className="my-1 list-disc pl-5">
          {items.map((it, ii) => (
            <li key={ii}>{inline(it, mine)}</li>
          ))}
        </ul>
      );
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && !special(lines[i])) para.push(lines[i++]);
    blocks.push(
      <p key={key++} className="whitespace-pre-wrap break-words">
        {para.map((p, pi) => (
          <Fragment key={pi}>
            {pi > 0 && <br />}
            {inline(p, mine)}
          </Fragment>
        ))}
      </p>
    );
  }
  return <div className="space-y-0.5">{blocks}</div>;
}
