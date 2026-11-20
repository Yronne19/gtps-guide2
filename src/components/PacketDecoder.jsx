import { useMemo, useState } from "react";
import { headerFields } from "../data/reference.js";

const MESSAGE_NAMES = {
  1: "SERVER_HELLO",
  2: "GENERIC_TEXT",
  3: "GAME_MESSAGE",
  4: "GAME_PACKET",
};

function buildTileChange() {
  const bytes = new Uint8Array(60);
  const dv = new DataView(bytes.buffer);
  dv.setUint32(0, 4, true); // message type GAME_PACKET
  dv.setUint8(4, 0x03); // TILE_CHANGE_REQUEST
  dv.setInt32(8, 1, true); // netID
  dv.setInt32(24, 2, true); // itemID (dirt)
  dv.setFloat32(28, 32, true); // posX (tile 1)
  dv.setFloat32(32, 736, true); // posY (tile 23)
  dv.setInt32(48, 1, true); // tileX
  dv.setInt32(52, 23, true); // tileY
  return bytes;
}

function buildCallFunction() {
  const enc = new TextEncoder();
  const name = enc.encode("OnConsoleMessage");
  const arg = enc.encode("hello from gtps");

  const parts = [];
  const entry = (index, text) => {
    const out = new Uint8Array(2 + 4 + text.length);
    out[0] = index;
    out[1] = 2; // string
    new DataView(out.buffer).setUint32(2, text.length, true);
    out.set(text, 6);
    parts.push(out);
  };

  const head = new Uint8Array([2]); // variant count
  entry(0, name);
  entry(1, arg);

  const extraLength = parts.reduce((sum, p) => sum + p.length, 1);
  const bytes = new Uint8Array(60 + extraLength);
  const dv = new DataView(bytes.buffer);
  dv.setUint32(0, 4, true);
  dv.setUint8(4, 0x01); // CALL_FUNCTION
  dv.setInt32(8, -1, true); // netID
  dv.setInt32(16, 0x08, true); // flags: S_EXTENDED
  dv.setInt32(24, 0, true); // itemID = delay in ms
  dv.setUint32(56, extraLength, true);
  bytes.set(head, 60);
  let at = 61;
  for (const part of parts) {
    bytes.set(part, at);
    at += part.length;
  }
  return bytes;
}

function toHex(bytes) {
  return bytes
    .reduce((out, b) => out + b.toString(16).padStart(2, "0") + " ", "")
    .trim()
    .toUpperCase();
}

function parseHex(text) {
  const clean = text
    .replace(/0x/gi, " ")
    .replace(/[^0-9a-fA-F]/g, " ")
    .trim();
  if (!clean) return [];
  return clean.split(/\s+/).map((chunk) => {
    // allow compact input like "0400000003000000"
    if (chunk.length > 2) {
      const out = [];
      for (let i = 0; i < chunk.length - 1; i += 2) out.push(parseInt(chunk.slice(i, i + 2), 16));
      return out;
    }
    return parseInt(chunk, 16);
  }).flat();
}

function u32(bytes, at) {
  if (at + 4 > bytes.length) return null;
  return new DataView(Uint8Array.from(bytes).buffer).getUint32(at, true);
}

function fmtFloat(value) {
  if (!Number.isFinite(value)) return "n/a";
  if (Math.abs(value) < 1e-6) return "0";
  return String(Number(value.toPrecision(7)));
}

function hexOf(bytes, from, to) {
  return bytes
    .slice(from, to)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
}

export default function PacketDecoder() {
  const [hex, setHex] = useState(toHex(buildTileChange()));
  const [pin, setPin] = useState("type");
  const [preset, setPreset] = useState("tile");

  const bytes = useMemo(() => parseHex(hex), [hex]);
  const msgType = u32(bytes, 0);

  const rows = useMemo(() => {
    if (msgType !== 4 || bytes.length < 60) return [];
    const dv = new DataView(Uint8Array.from(bytes).buffer);
    return headerFields.map((field) => {
      const at = 4 + field.offset;
      let le = "—";
      let be = "—";
      if (at + field.size <= bytes.length) {
        if (field.type === "u8") {
          le = String(dv.getUint8(at));
          be = le;
        } else if (field.type === "i32") {
          le = String(dv.getInt32(at, true));
          be = String(dv.getInt32(at, false));
        } else if (field.type === "u32") {
          le = String(dv.getUint32(at, true));
          be = String(dv.getUint32(at, false));
        } else {
          le = fmtFloat(dv.getFloat32(at, true));
          be = fmtFloat(dv.getFloat32(at, false));
        }
      }
      return {
        ...field,
        packetOffset: at,
        raw: hexOf(bytes, at, at + field.size),
        le,
        be,
      };
    });
  }, [bytes, msgType]);

  const pinned = rows.find((r) => r.name === pin) || null;
  const highlight = pinned
    ? [pinned.packetOffset, pinned.packetOffset + pinned.size]
    : [0, 4];

  const extraLength = rows.find((r) => r.name === "extraDataLength");
  const realExtra = Math.max(0, bytes.length - 60);
  const declaredExtra = extraLength ? Number(extraLength.le) : 0;
  const extraMismatch = rows.length > 0 && declaredExtra !== realExtra;

  const textBody = useMemo(() => {
    if (msgType !== 2 && msgType !== 3) return "";
    let text = "";
    for (let i = 4; i < bytes.length; i++) {
      if (bytes[i] === 0) break;
      text += String.fromCharCode(bytes[i]);
    }
    return text;
  }, [bytes, msgType]);

  function load(kind) {
    setPreset(kind);
    setPin("type");
    setHex(toHex(kind === "tile" ? buildTileChange() : buildCallFunction()));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => load("tile")}
          className={`btn ${preset === "tile" ? "border-lime/60 text-lime" : ""}`}
        >
          example · 0x03 tile change
        </button>
        <button
          type="button"
          onClick={() => load("call")}
          className={`btn ${preset === "call" ? "border-lime/60 text-lime" : ""}`}
        >
          example · 0x01 OnConsoleMessage
        </button>
        <button
          type="button"
          onClick={() => setHex("")}
          className="btn"
        >
          clear
        </button>
        <span className="ml-auto font-mono text-[11px] text-dim">
          {bytes.length} bytes parsed
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              paste hex from your tracker
            </span>
            <textarea
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              spellCheck={false}
              rows={6}
              placeholder="04 00 00 00 03 00 ..."
              className="field resize-y leading-6"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <Stat
              label="message type"
              value={msgType === null ? "—" : `${msgType}`}
              hint={MESSAGE_NAMES[msgType] || "unknown type"}
            />
            <Stat
              label="extra data"
              value={`${realExtra} B`}
              hint={
                rows.length
                  ? `header says ${declaredExtra} B`
                  : "needs a 60-byte GAME_PACKET"
              }
              warn={extraMismatch}
            />
          </div>

          {textBody ? (
            <div className="panel p-3">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-dim">
                text body (types 2 / 3)
              </div>
              <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-6 text-mint">
                {textBody}
              </pre>
            </div>
          ) : null}

          <HexDump bytes={bytes} highlight={highlight} />
        </div>

        <div className="panel overflow-x-auto">
          <div className="border-b border-line px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            decoded fields · tap a row to highlight its bytes
          </div>
          {rows.length ? (
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full min-w-[34rem] text-left">
                <thead className="sticky top-0 bg-panel2 font-mono text-[10px] uppercase tracking-wider text-dim">
                  <tr>
                    <th className="px-3 py-2 font-normal">field</th>
                    <th className="px-2 py-2 font-normal">bytes</th>
                    <th className="px-2 py-2 font-normal">LE</th>
                    <th className="px-3 py-2 font-normal">BE (wrong)</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[11px]">
                  {rows.map((row) => (
                    <tr
                      key={row.name}
                      onClick={() => setPin(row.name)}
                      className={`cursor-pointer border-t border-line/70 transition ${
                        pin === row.name ? "bg-lime/[0.07]" : "hover:bg-panel2/60"
                      }`}
                    >
                      <td className="px-3 py-1.5">
                        <span className="text-body">{row.name}</span>
                        <span className="ml-2 text-[10px] text-dim">{row.type}</span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-dim">{row.raw}</td>
                      <td className="px-2 py-1.5 text-lime">{row.le}</td>
                      <td className="px-3 py-1.5 text-dim/60">{row.be}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-4 text-sm leading-6 text-dim">
              Not a GAME_PACKET yet. A type 4 packet needs at least 60 bytes: 4 bytes of
              message type plus the 56-byte header. Type 2 and 3 packets are text and are
              shown on the left.
            </p>
          )}
        </div>
      </div>

      <p className="font-mono text-[11px] leading-5 text-dim">
        Le values are what the server reads. The BE column is the same four bytes read
        big-endian — useful to recognise a byte order mistake at a glance.
      </p>
    </div>
  );
}

function Stat({ label, value, hint, warn }) {
  return (
    <div className={`panel px-3 py-2 ${warn ? "border-amber-400/40" : ""}`}>
      <div className="font-mono text-[10px] uppercase tracking-wider text-dim">{label}</div>
      <div className="font-mono text-lg text-white">{value}</div>
      <div className={`font-mono text-[10px] ${warn ? "text-amber-300" : "text-dim"}`}>
        {hint}
      </div>
    </div>
  );
}

function HexDump({ bytes, highlight }) {
  const rows = [];
  for (let i = 0; i < bytes.length; i += 8) rows.push(i);

  return (
    <div className="panel overflow-x-auto p-3">
      <div className="mb-1.5 flex justify-between font-mono text-[10px] uppercase tracking-wider text-dim">
        <span>hex dump</span>
        <span>lime = selected field</span>
      </div>
      <div className="min-w-max space-y-1 font-mono text-[11px]">
        {rows.length === 0 ? (
          <div className="py-4 text-center text-dim">no bytes</div>
        ) : null}
        {rows.map((start) => (
          <div key={start} className="flex items-center gap-3">
            <span className="w-8 text-dim/60">{start.toString(16).padStart(4, "0")}</span>
            <span className="flex gap-1">
              {bytes.slice(start, start + 8).map((byte, offset) => {
                const index = start + offset;
                const on = index >= highlight[0] && index < highlight[1];
                return (
                  <span
                    key={index}
                    className={`rounded px-1 py-0.5 ${
                      on ? "bg-lime/25 text-lime" : "text-body/80"
                    } ${index < 4 ? "text-amber-200/80" : ""}`}
                  >
                    {byte.toString(16).padStart(2, "0")}
                  </span>
                );
              })}
            </span>
            <span className="text-dim/50">
              {bytes
                .slice(start, start + 8)
                .map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : "."))
                .join("")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
