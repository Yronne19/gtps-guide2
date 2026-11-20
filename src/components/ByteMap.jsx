import { useState } from "react";

const TYPE_STYLES = {
  u8: "bg-amber-400/10 border-amber-400/35 text-amber-200 hover:bg-amber-400/20",
  i32: "bg-mint/10 border-mint/35 text-mint hover:bg-mint/20",
  u32: "bg-violet-400/10 border-violet-400/35 text-violet-200 hover:bg-violet-400/20",
  f32: "bg-sky-400/10 border-sky-400/35 text-sky-200 hover:bg-sky-400/20",
};

const TYPE_HEX = {
  u8: "byte",
  i32: "4 bytes, little-endian",
  u32: "4 bytes, little-endian",
  f32: "4 bytes, little-endian float",
};

const LEGEND = [
  ["u8", "1-byte field"],
  ["i32", "signed 32-bit integer"],
  ["u32", "unsigned 32-bit integer"],
  ["f32", "32-bit float"],
];

export default function ByteMap({ fields }) {
  const [selected, setSelected] = useState(fields[0]);
  const totalBytes = 56;

  return (
    <div className="panel overflow-x-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          header byte map · 56 bytes
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {LEGEND.map(([type, label]) => (
            <span key={type} className="flex items-center gap-1.5">
              <i
                className={`size-2.5 rounded-sm border ${TYPE_STYLES[type].split(" ")[0]} ${TYPE_STYLES[type].split(" ")[1]}`}
              />
              <span className="font-mono text-[10px] text-dim">{label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-1 flex font-mono text-[10px] text-dim/70">
          {[0, 8, 16, 24, 32, 40, 48].map((tick) => (
            <span key={tick} style={{ flexGrow: 8 }} className="border-l border-line2 pl-1">
              {tick}
            </span>
          ))}
        </div>

        <div className="flex gap-[3px]">
          {fields.map((field) => {
            const active = selected?.name === field.name;
            return (
              <button
                key={field.name}
                type="button"
                onClick={() => setSelected(field)}
                style={{ flexGrow: field.size }}
                title={`${field.name} · ${field.type} @ ${field.offset}`}
                className={`min-w-0 cursor-pointer truncate rounded-md border px-1 py-3 text-center font-mono text-[10px] transition sm:py-4 sm:text-[11px] ${
                  TYPE_STYLES[field.type]
                } ${active ? "ring-2 ring-lime/70 ring-offset-2 ring-offset-panel" : ""} ${
                  field.size === 1 ? "px-0.5" : ""
                }`}
              >
                <span className="hidden sm:inline">{field.name}</span>
                <span className="sm:hidden">{field.name.slice(0, 4)}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex justify-between font-mono text-[10px] text-dim/60">
          <span>header byte 0 = packet byte 4</span>
          <span>header byte {totalBytes - 1} · then extra data</span>
        </div>
      </div>

      {selected ? (
        <div className="grid gap-4 border-t border-line bg-panel2/60 p-4 sm:grid-cols-[1fr_1.4fr]">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-lg font-semibold text-white">
                {selected.name}
              </span>
              <span className={`chip ${TYPE_STYLES[selected.type]}`}>{selected.type}</span>
            </div>
            <dl className="mt-3 space-y-1.5 font-mono text-[11px]">
              <Row label="offset" value={`${selected.offset} (packet ${selected.offset + 4})`} />
              <Row label="size" value={`${selected.size} byte${selected.size > 1 ? "s" : ""}`} />
              <Row label="order" value={TYPE_HEX[selected.type]} />
              <Row label="gurotopia" value={selected.alt} />
            </dl>
          </div>
          <div className="self-center text-sm leading-6 text-body/85">
            {selected.meaning}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-dim">{label}</dt>
      <dd className="text-body/90">{value}</dd>
    </div>
  );
}
