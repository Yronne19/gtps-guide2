import { useState } from "react";

export default function FileTabs({ files, note }) {
  const names = Object.keys(files);
  const [active, setActive] = useState(names[0]);
  const [copied, setCopied] = useState(false);
  const file = files[active];

  async function copy() {
    try {
      await navigator.clipboard.writeText(file.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="panel overflow-x-auto">
      <div className="flex items-stretch gap-0.5 overflow-x-auto border-b border-line bg-panel2/70 px-1.5">
        {names.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setActive(name)}
            className={`shrink-0 border-b-2 px-2.5 py-2 font-mono text-[11px] transition ${
              active === name
                ? "border-lime text-lime"
                : "border-transparent text-dim hover:text-body"
            }`}
          >
            {name}
          </button>
        ))}
        <button
          type="button"
          onClick={copy}
          className="ml-auto shrink-0 px-2.5 font-mono text-[10px] uppercase tracking-wider text-dim transition hover:text-lime"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>

      <pre className="overflow-x-auto px-4 py-3.5 text-[12px] leading-6">
        <code className="font-mono text-[#cfe4d8]">{file.code}</code>
      </pre>

      {file.note || note ? (
        <div className="border-t border-line px-4 py-2 font-mono text-[11px] leading-5 text-dim">
          {file.note || note}
        </div>
      ) : null}
    </div>
  );
}
