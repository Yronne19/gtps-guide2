import { useMemo, useState } from "react";

export function PacketTable({ packets }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return packets;
    return packets.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.hex.includes(q.replace(/^0x/, "")) ||
        p.note.toLowerCase().includes(q)
    );
  }, [packets, query]);

  return (
    <div className="panel overflow-x-auto">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-3.5 py-2.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="filter by name or hex…"
          className="field max-w-xs flex-1"
        />
        <span className="ml-auto font-mono text-[11px] text-dim">
          {filtered.length} / {packets.length}
        </span>
      </div>
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full min-w-[34rem] text-left">
          <thead className="sticky top-0 z-10 bg-panel2 font-mono text-[10px] uppercase tracking-wider text-dim">
            <tr>
              <th className="px-3.5 py-2 font-normal">type</th>
              <th className="px-2 py-2 font-normal">name</th>
              <th className="px-3.5 py-2 font-normal">notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.hex} className="border-t border-line/70 transition hover:bg-panel2/50">
                <td className="whitespace-nowrap px-3.5 py-2 font-mono text-[11px] text-lime">
                  0x{p.hex}
                  <span className="ml-1.5 text-dim/60">{String(p.dec).padStart(2, "0")}</span>
                </td>
                <td className="whitespace-nowrap px-2 py-2 font-mono text-[11px] text-body">
                  {p.name}
                  {p.extra ? (
                    <span
                      className="ml-1.5 rounded bg-mint/15 px-1 py-0.5 text-[9px] text-mint"
                      title="carries extra data"
                    >
                      +data
                    </span>
                  ) : null}
                </td>
                <td className="px-3.5 py-2 text-xs leading-5 text-dim">{p.note || "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-dim">
                  no packet matches “{query}”
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ActionGrid({ actions }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? actions.filter((a) => a.name.toLowerCase().includes(q)) : actions;
  }, [actions, query]);

  return (
    <div className="panel overflow-x-auto">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-3.5 py-2.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="filter actions…"
          className="field max-w-xs flex-1"
        />
        <span className="ml-auto font-mono text-[11px] text-dim">
          {filtered.length} / {actions.length}
        </span>
      </div>
      <div className="grid max-h-[520px] gap-px overflow-auto bg-line/60 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((action) => (
          <div key={action.name} className="bg-panel px-3 py-2">
            <div className="truncate font-mono text-[11px] text-mint">
              <span className="text-dim/70">action|</span>
              {action.name}
            </div>
            {action.note ? (
              <div className="mt-0.5 text-[10px] leading-4 text-dim">{action.note}</div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="border-t border-line px-3.5 py-2 font-mono text-[10px] text-dim">
        message type 3 (GAME_MESSAGE) · key|value lines
      </div>
    </div>
  );
}

export function FunctionList({ functions }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return functions;
    return functions.filter(
      (f) => f.name.toLowerCase().includes(q) || f.note.toLowerCase().includes(q)
    );
  }, [functions, query]);

  return (
    <div className="panel overflow-x-auto">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-3.5 py-2.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="filter functions…"
          className="field max-w-xs flex-1"
        />
        <span className="ml-auto font-mono text-[11px] text-dim">
          {filtered.length} shown
        </span>
      </div>
      <ul className="divide-y divide-line/70">
        {filtered.map((fn) => (
          <li key={fn.name} className="px-3.5 py-3">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-mono text-[12px] text-white">{fn.name}</span>
              {fn.args ? (
                <span className="font-mono text-[11px] text-mint/80">({fn.args})</span>
              ) : (
                <span className="font-mono text-[11px] text-dim">()</span>
              )}
            </div>
            <p className="mt-1 text-xs leading-5 text-dim">{fn.note}</p>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-dim">nothing matches</li>
        ) : null}
      </ul>
    </div>
  );
}
