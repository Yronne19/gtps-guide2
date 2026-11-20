import { useMemo, useState } from "react";

function hexToBytes(text) {
  const clean = text.replace(/0x/gi, "").replace(/[^0-9a-fA-F]/g, "");
  const out = [];
  for (let i = 0; i < clean.length - 1; i += 2) out.push(parseInt(clean.slice(i, i + 2), 16));
  return out;
}

function bytesToHex(bytes) {
  return bytes.map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ");
}

export default function EndianLab() {
  const [hex, setHex] = useState("01 00 00 00");
  const [decimal, setDecimal] = useState("17091");

  const bytes = useMemo(() => hexToBytes(hex).slice(0, 4), [hex]);
  const values = useMemo(() => {
    if (bytes.length < 4) return null;
    const buffer = new Uint8Array(bytes).buffer;
    const dv = new DataView(buffer);
    return {
      u32le: dv.getUint32(0, true),
      u32be: dv.getUint32(0, false),
      i32le: dv.getInt32(0, true),
      u32leHex: "0x" + dv.getUint32(0, true).toString(16).toUpperCase().padStart(8, "0"),
      f32le: dv.getFloat32(0, true),
    };
  }, [bytes]);

  const encoded = useMemo(() => {
    const n = Number(decimal);
    if (!Number.isFinite(n) || decimal.trim() === "") return null;
    const raw = Math.trunc(n) >>> 0;
    const le = new Uint8Array(4);
    new DataView(le.buffer).setUint32(0, raw, true);
    const be = new Uint8Array(4);
    new DataView(be.buffer).setUint32(0, raw, false);
    return { le: bytesToHex([...le]), be: bytesToHex([...be]) };
  }, [decimal]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="panel p-4">
        <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          four bytes → numbers
        </div>
        <p className="mb-3 text-xs leading-5 text-dim">
          Type four bytes and see the same memory read both ways.
        </p>
        <input
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          spellCheck={false}
          placeholder="01 00 00 00"
          className="field tracking-[0.2em]"
        />

        {values ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Result label="u32 little-endian" value={values.u32le} accent />
            <Result label="u32 big-endian" value={values.u32be} />
            <Result label="i32 little-endian" value={values.i32le} />
            <Result
              label="f32 little-endian"
              value={Number(values.f32le.toPrecision(7))}
            />
          </div>
        ) : (
          <p className="mt-3 font-mono text-[11px] text-amber-300">
            need 4 bytes to read a 32-bit value
          </p>
        )}

        {values ? (
          <p className="mt-3 font-mono text-[11px] leading-5 text-dim">
            byte order on the wire: {bytesToHex(bytes)}
            <br />
            as u32 hex, LE: {values.u32leHex}
          </p>
        ) : null}
      </div>

      <div className="panel p-4">
        <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          number → bytes
        </div>
        <p className="mb-3 text-xs leading-5 text-dim">
          Growtopia payloads are little-endian, so the bytes come out reversed.
        </p>
        <input
          value={decimal}
          onChange={(e) => setDecimal(e.target.value.replace(/[^0-9-]/g, ""))}
          inputMode="numeric"
          className="field"
        />
        {encoded ? (
          <div className="mt-3 space-y-2">
            <div className="rounded-lg border border-mint/30 bg-mint/[0.05] px-3 py-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-mint">
                little-endian · send this
              </div>
              <div className="font-mono text-base tracking-[0.18em] text-white">
                {encoded.le}
              </div>
            </div>
            <div className="rounded-lg border border-line px-3 py-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-dim">
                big-endian · what ENet headers use
              </div>
              <div className="font-mono text-base tracking-[0.18em] text-body/70">
                {encoded.be}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-3 font-mono text-[11px] text-amber-300">
            enter a number
          </p>
        )}
      </div>
    </div>
  );
}

function Result({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-line bg-ink px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-wider text-dim">{label}</div>
      <div
        className={`truncate font-mono text-sm ${accent ? "text-lime" : "text-body/80"}`}
        title={String(value)}
      >
        {value}
      </div>
    </div>
  );
}
