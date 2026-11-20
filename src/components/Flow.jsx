const NODES = [
  {
    title: "Growtopia client",
    sub: "5.60 Android / your own client",
    tag: "starts here",
    lines: ["POST server_data.php", "then speaks ENet"],
  },
  {
    title: "Web endpoint",
    sub: "HTTPS · www.growtopia1.com",
    tag: "plain text reply",
    lines: ["server|", "port|", "loginurl|"],
  },
  {
    title: "ENet server",
    sub: "UDP 17091 by default",
    tag: "everything after this",
    lines: ["SERVER_HELLO", "GENERIC_TEXT", "GAME_PACKET"],
  },
];

export function ArchitectureDiagram() {
  return (
    <div className="panel p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
          connection path
        </span>
        <span className="chip">https once, ENet after</span>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        {NODES.map((node, index) => (
          <div key={node.title} className="flex flex-1 items-center gap-3 sm:flex-col sm:gap-2">
            <div className="w-full rounded-lg border border-line2 bg-panel2 p-3">
              <div className="mb-0.5 flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-white">{node.title}</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-mint/70">
                  {node.tag}
                </span>
              </div>
              <div className="mb-2 font-mono text-[10px] text-dim">{node.sub}</div>
              <ul className="space-y-0.5 font-mono text-[10px] text-body/70">
                {node.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            {index < NODES.length - 1 ? (
              <div className="flex shrink-0 items-center justify-center text-mint/60 sm:w-full">
                <span className="hidden font-mono text-[10px] sm:block">
                  {index === 0 ? "HTTPS" : "UDP"}
                </span>
                <span className="text-lg leading-none sm:hidden">→</span>
                <span className="hidden h-px flex-1 bg-line2 sm:block" />
                <span className="hidden text-sm sm:block">→</span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

const STEP_STYLES = {
  c2s: { dot: "bg-sky-400", text: "text-sky-300", arrow: "→", label: "client → server" },
  s2c: { dot: "bg-mint", text: "text-mint", arrow: "←", label: "server → client" },
  web: { dot: "bg-amber-400", text: "text-amber-300", arrow: "⇄", label: "HTTPS" },
};

export function Trace({ steps }) {
  return (
    <div className="panel overflow-x-auto">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
          handshake trace
        </span>
        <span className="font-mono text-[10px] text-dim">read top to bottom</span>
      </div>
      <ol className="divide-y divide-line/70">
        {steps.map((step, index) => {
          const style = STEP_STYLES[step.dir];
          return (
            <li
              key={index}
              className="grid grid-cols-[1.7rem_1fr] gap-3 px-3 py-2.5 transition hover:bg-panel2/50 sm:grid-cols-[1.7rem_auto_1fr] sm:items-baseline"
            >
              <span className="font-mono text-[11px] text-dim/60">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-sm ${style.text}`}>{style.arrow}</span>
                <span className="whitespace-nowrap font-mono text-[11px] text-body">
                  {step.msg}
                </span>
              </div>
              <div className="col-start-2 text-xs leading-5 text-dim sm:col-start-3">
                {step.detail}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const SEGMENTS = [
  {
    label: "integrity",
    size: "6 B",
    body: "client → server only",
    width: 6,
    tone: "bg-rose-400/20 border-rose-400/40 text-rose-200",
  },
  {
    label: "peer / flags",
    size: "2 B",
    body: "low 12 bits peer id",
    width: 2,
    tone: "bg-violet-400/20 border-violet-400/40 text-violet-200",
  },
  {
    label: "CRC32",
    size: "4 B",
    body: "enet_crc32",
    width: 4,
    tone: "bg-sky-400/20 border-sky-400/40 text-sky-200",
  },
  {
    label: "ENet commands",
    size: "rest",
    body: "range-coded, fragmented",
    width: 26,
    tone: "bg-mint/20 border-mint/40 text-mint",
  },
];

export function AnatomyBar({ title = "ENet datagram on the wire" }) {
  return (
    <div className="panel p-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
        {title} · all fields big-endian
      </div>
      <div className="flex gap-[3px]">
        {SEGMENTS.map((segment) => (
          <div
            key={segment.label}
            style={{ flexGrow: segment.width }}
            className={`overflow-hidden rounded-md border px-1.5 py-2 ${segment.tone}`}
          >
            <div className="truncate font-mono text-[10px]">{segment.label}</div>
            <div className="font-mono text-[9px] opacity-70">{segment.size}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {SEGMENTS.map((segment) => (
          <div key={segment.label} className="font-mono text-[10px] text-dim">
            <span className="text-body/80">{segment.label}</span> — {segment.body}
          </div>
        ))}
      </div>
    </div>
  );
}
