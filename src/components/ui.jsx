import { useState } from "react";

export function SectionHeading({ index, eyebrow, title, intro }) {
  return (
    <header className="mb-8">
      <div className="mb-3 flex items-center gap-3">
        <span className="font-mono text-[11px] text-dim">{index}</span>
        <span className="h-px w-8 bg-line2" />
        <span className="h2">{eyebrow}</span>
      </div>
      <h2 className="h3">{title}</h2>
      {intro ? <p className="prose-p mt-3 max-w-3xl">{intro}</p> : null}
    </header>
  );
}

export function Callout({ tone = "note", title, children }) {
  const tones = {
    note: "border-mint/25 bg-mint/[0.04]",
    warn: "border-amber-400/30 bg-amber-400/[0.05]",
    danger: "border-rose-400/30 bg-rose-400/[0.05]",
  };
  const labels = {
    note: "text-mint",
    warn: "text-amber-300",
    danger: "text-rose-300",
  };
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${tones[tone]}`}>
      {title ? (
        <div
          className={`mb-1 font-mono text-[11px] uppercase tracking-[0.14em] ${labels[tone]}`}
        >
          {title}
        </div>
      ) : null}
      <div className="text-sm leading-6 text-body/90">{children}</div>
    </div>
  );
}

export function CodeBlock({ title, language = "cpp", code, note }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <figure className="panel overflow-x-auto">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2">
        <div className="flex items-center gap-2.5">
          <span className="flex gap-1">
            <i className="size-2 rounded-full bg-line2" />
            <i className="size-2 rounded-full bg-line2" />
            <i className="size-2 rounded-full bg-mint/50" />
          </span>
          <figcaption className="font-mono text-[11px] text-dim">
            {title || language}
          </figcaption>
        </div>
        <button
          type="button"
          onClick={copy}
          className="font-mono text-[10px] uppercase tracking-wider text-dim transition hover:text-lime"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3.5 text-[12px] leading-6">
        <code className="font-mono text-[#cfe4d8]">{code}</code>
      </pre>
      {note ? (
        <div className="border-t border-line px-4 py-2 font-mono text-[11px] text-dim">
          {note}
        </div>
      ) : null}
    </figure>
  );
}
