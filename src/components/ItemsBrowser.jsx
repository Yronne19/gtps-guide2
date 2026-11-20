import { useMemo, useRef, useState } from "react";
import {
  FIELD_META,
  GROUPS,
  blankItem,
  decodeItems,
  editableFields,
  encodeItems,
  hexOf,
  isLossless,
  itemValues,
  itemsToTxt,
  jsonToItems,
  protonHash,
  txtToItems,
  typeLabel,
  valuesToJson,
} from "../itemsCodec.js";
import { imageToRttex, rttexToPng } from "../rttex.js";

export { decodeItems };

const TOOLS = [
  { id: "decode", label: "items.dat decoder" },
  { id: "add", label: "custom items" },
  { id: "hash", label: "proton hash" },
  { id: "rttex", label: "rttex → png" },
];

function download(bytes, filename, mime = "application/octet-stream") {
  const blob = bytes instanceof Blob ? bytes : new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const NUM_RE = /^-?\d+$/;
const HEX_RE = /^[0-9a-fA-F ]*$/;

export default function ItemsBrowser() {
  const [tool, setTool] = useState("decode");

  const [db, setDb] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(100);
  const [selected, setSelected] = useState(null); // {type:'item', index} | {type:'new', key}
  const [edits, setEdits] = useState({});
  const [added, setAdded] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [openGroups, setOpenGroups] = useState({ identity: true, texture: true, gameplay: true });
  const [showJson, setShowJson] = useState(false);

  const [importText, setImportText] = useState("");
  const [importFrom, setImportFrom] = useState("0");
  const [importFromKind, setImportFromKind] = useState("index");
  const [importMode, setImportMode] = useState("patch");
  const [importMsg, setImportMsg] = useState("");

  const [fileHash, setFileHash] = useState(null);
  const [rt, setRt] = useState(null);
  const [rtMsg, setRtMsg] = useState("");

  const newKey = useRef(0);

  async function onFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const next = decodeItems(await file.arrayBuffer());
      setDb(next);
      setEdits({});
      setAdded([]);
      setDrafts({});
      setSelected(next.list[0] ? { type: "item", index: 0 } : null);
      setError("");
      setImportMsg("");
      if (!isLossless(next)) {
        setError(
          "decoded, but this file does not re-encode byte for byte: some bytes are not understood, so only export for experiments",
        );
      }
    } catch (e) {
      setDb(null);
      setEdits({});
      setAdded([]);
      setSelected(null);
      setError(String(e.message || e));
    }
    event.target.value = "";
  }

  const rows = useMemo(() => {
    if (!db) return [];
    const q = query.trim().toLowerCase();
    if (!q) return db.list;
    return db.list.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        String(it.id) === q ||
        typeLabel(it.type).toLowerCase() === q,
    );
  }, [db, query]);

  const changed = useMemo(() => {
    if (!db) return [];
    return Object.keys(edits)
      .map(Number)
      .filter((i) => Object.keys(edits[i] || {}).length > 0)
      .map((i) => ({
        index: i,
        id: db.list[i]?.id,
        name: edits[i].name ?? db.list[i]?.name ?? "",
        count: Object.keys(edits[i]).length,
      }));
  }, [db, edits]);

  const addedValues = useMemo(() => added.map((a) => a.values), [added]);
  const output = useMemo(
    () => (db ? encodeItems(db, edits, addedValues) : null),
    [db, edits, addedValues],
  );
  const outputHash = useMemo(() => (output ? protonHash(output) : 0), [output]);
  const sizeDelta = output && db ? output.length - db.bytes.length : 0;
  const dirty = changed.length + added.length;

  const allValues = useMemo(() => {
    if (!db) return [];
    return [
      ...db.list.map((it) => ({ ...itemValues(db, it), ...(edits[it.index] || {}) })),
      ...added.map((a) => a.values),
    ];
  }, [db, edits, added]);

  const fields = useMemo(() => (db ? editableFields(db) : []), [db]);
  const fieldsByGroup = useMemo(() => {
    const out = {};
    for (const f of fields) (out[f.group] ??= []).push(f);
    return out;
  }, [fields]);

  const activeItem = db && selected?.type === "item" ? db.list[selected.index] : null;
  const activeNew = selected?.type === "new" ? added.find((a) => a.key === selected.key) : null;
  const baseValues = useMemo(
    () => (db && activeItem ? itemValues(db, activeItem) : null),
    [db, activeItem],
  );
  const activeValues = useMemo(() => {
    if (activeNew) return activeNew.values;
    if (!baseValues) return null;
    return { ...baseValues, ...(edits[activeItem.index] || {}) };
  }, [activeNew, baseValues, edits, activeItem]);

  const selKey = selected ? (selected.type === "new" ? selected.key : `i${selected.index}`) : "none";

  function setValue(tag, value) {
    if (!db || !selected) return;
    if (selected.type === "new") {
      setAdded((prev) =>
        prev.map((a) => (a.key === selected.key ? { ...a, values: { ...a.values, [tag]: value } } : a)),
      );
      return;
    }
    const item = db.list[selected.index];
    if (!item) return;
    const base = itemValues(db, item)[tag];
    const same = String(value) === String(base ?? "");
    setEdits((prev) => {
      const mine = { ...(prev[item.index] || {}) };
      if (same) delete mine[tag];
      else mine[tag] = value;
      const next = { ...prev };
      if (Object.keys(mine).length) next[item.index] = mine;
      else delete next[item.index];
      return next;
    });
  }

  function onInput(field, text) {
    setDrafts((prev) => ({ ...prev, [`${selKey}:${field.tag}`]: text }));
    if (field.kind === "num") {
      if (NUM_RE.test(text)) setValue(field.tag, Number(text));
    } else if (field.kind === "hex") {
      if (HEX_RE.test(text)) setValue(field.tag, text.replace(/\s+/g, "").toUpperCase());
    } else {
      setValue(field.tag, text);
    }
  }

  function clearDraft(field) {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[`${selKey}:${field.tag}`];
      return next;
    });
  }

  function revertItem(index) {
    setDrafts({});
    setEdits((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }

  function addItem(kind) {
    if (!db) return;
    const source = activeValues ?? (db.list.length ? itemValues(db, db.list[db.list.length - 1]) : null);
    if (!source) return;
    const values =
      kind === "duplicate"
        ? { ...source, id: db.list.length + added.length, name: `${source.name || "Item"} copy` }
        : blankItem(db, added.length);
    const key = `new-${++newKey.current}`;
    setAdded((prev) => [...prev, { key, values }]);
    setSelected({ type: "new", key });
  }

  function removeNew(key) {
    setAdded((prev) => prev.filter((a) => a.key !== key));
    if (selected?.type === "new" && selected.key === key) setSelected(null);
  }

  function applyImport() {
    if (!db) return;
    const text = importText.trim();
    if (!text) {
      setImportMsg("paste items JSON (ours or GrowTools') or a GrowTools TXT first");
      return;
    }

    let incoming = [];
    let format = "json";
    try {
      incoming = jsonToItems(text);
    } catch {
      try {
        incoming = txtToItems(text);
        format = "txt";
      } catch (e) {
        setImportMsg(`could not parse: ${e.message || e}`);
        return;
      }
    }
    if (!incoming.length) {
      setImportMsg("no items found in that text");
      return;
    }

    let start = 0;
    if (importMode === "patch") {
      const raw = importFrom.trim();
      if (raw) {
        const n = Number(raw);
        if (!Number.isInteger(n)) {
          setImportMsg("start must be a whole index or item id");
          return;
        }
        if (importFromKind === "id") {
          const found = db.list.findIndex((it) => it.id === n);
          if (found < 0) {
            setImportMsg(`no item with id ${n}`);
            return;
          }
          start = found;
        } else {
          start = Math.max(0, n);
        }
      }
    }

    const nextEdits = { ...edits };
    const nextAdded = [...added];
    let patched = 0;
    let appended = 0;
    const fresh = [];

    incoming.forEach((values, i) => {
      const pos = importMode === "append" ? -1 : start + i;
      if (pos < 0 || pos >= db.list.length) {
        fresh.push(values);
        return;
      }
      const base = itemValues(db, db.list[pos]);
      const mine = { ...(nextEdits[pos] || {}) };
      let touched = 0;
      for (const [tag, raw] of Object.entries(values)) {
        const kind = FIELD_META[tag]?.kind;
        if (!kind) continue; // not a field in this file's layout
        const val = raw;
        const baseVal = kind === "hex" ? String(base[tag] ?? "").toUpperCase() : base[tag];
        if (String(val) === String(baseVal ?? "")) delete mine[tag];
        else {
          mine[tag] = val;
          touched++;
        }
      }
      if (Object.keys(mine).length) nextEdits[pos] = mine;
      else delete nextEdits[pos];
      if (touched) patched++;
    });

    for (const values of fresh) {
      const id = db.list.length + nextAdded.length;
      const v = { ...values };
      if (v.id === undefined || db.list.some((it) => it.id === Number(v.id))) v.id = id;
      if (v.name === undefined) v.name = "Imported Item";
      nextAdded.push({ key: `new-${++newKey.current}`, values: v });
      appended++;
    }

    setEdits(nextEdits);
    setAdded(nextAdded);
    setDrafts({});
    if (appended) setSelected({ type: "new", key: nextAdded[nextAdded.length - 1].key });
    setImportMsg(
      `${format} import: patched ${patched} item${patched === 1 ? "" : "s"}` +
        `${importMode === "patch" ? ` from ${importFromKind} ${start}` : ""}` +
        `, appended ${appended} new item${appended === 1 ? "" : "s"}`,
    );
  }

  function exportJson() {
    const payload = {
      version: db.version,
      itemCount: allValues.length,
      hash: outputHash,
      items: allValues.map((v, i) => valuesToJson(db.list[i] ?? { index: i }, v)),
    };
    download(JSON.stringify(payload, null, 2), "items.json", "application/json");
  }

  async function hashFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileHash({ name: file.name, size: file.size, hash: protonHash(new Uint8Array(await file.arrayBuffer())) });
    event.target.value = "";
  }

  async function rttexIn(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const res = await rttexToPng(await file.arrayBuffer());
      setRt({
        url: res.url,
        name: `${file.name.replace(/\.[^.]+$/, "")}.png`,
        note: `${res.width} × ${res.height} · ${res.bpp === 4 ? "RGBA8888" : "RGB888"} · format ${res.format}`,
        blob: res.blob,
      });
      setRtMsg("");
    } catch (e) {
      setRt(null);
      setRtMsg(String(e.message || e));
    }
    event.target.value = "";
  }

  async function rttexOut(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const bytes = await imageToRttex(file);
      setRt({
        url: null,
        name: `${file.name.replace(/\.[^.]+$/, "")}.rttex`,
        note: `${file.name} · RTPACK · proton hash ${protonHash(bytes)}`,
        blob: new Blob([bytes], { type: "application/octet-stream" }),
      });
      setRtMsg("");
    } catch (e) {
      setRt(null);
      setRtMsg(String(e.message || e));
    }
    event.target.value = "";
  }

  const importPlaceholder = `[
  {
    "id": 2,
    "name": "Dirt",
    "type": 17,
    "collision": 1,
    "maxAmount": 200,
    "rawHits": 18,
    "growTime": 0,
    "info": "Yep, it's dirt."
  }
]`;

  // The per-item editor is shared by the decoder and the custom-items section.
  const editorPanel = (
    <aside className="panel h-fit p-4">
      {activeValues ? (
        <>
          <div className="flex items-baseline justify-between gap-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-dim">
              {activeNew ? "new item" : "edit item"}
            </div>
            <div className="font-mono text-[10px] text-mint">
              #{activeValues.id} · index {activeNew ? added.findIndex((a) => a.key === activeNew.key) : selected.index}
            </div>
          </div>

          {GROUPS.map((group) => {
            const list = fieldsByGroup[group.id];
            if (!list?.length) return null;
            const open = openGroups[group.id] ?? group.open;
            return (
              <div key={group.id} className="mt-3 border-t border-line/70 pt-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between"
                  onClick={() => setOpenGroups((prev) => ({ ...prev, [group.id]: !open }))}
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-dim">{group.label}</span>
                  <span className="font-mono text-[10px] text-dim/60">
                    {list.length} {open ? "−" : "+"}
                  </span>
                </button>

                {open ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {list.map((f) => {
                      const stored = activeValues[f.tag];
                      const draft = drafts[`${selKey}:${f.tag}`];
                      const shown = draft !== undefined ? draft : String(stored ?? "");
                      const isEdited = !activeNew && edits[selected.index]?.[f.tag] !== undefined;
                      return (
                        <label
                          key={f.tag}
                          title={f.hint}
                          className={`block ${f.kind === "str" || (f.kind === "hex" && f.len > 8) ? "col-span-2" : ""}`}
                        >
                          <span className="font-mono text-[10px] text-dim">
                            {f.label}
                            {f.tag === "type" ? ` · ${typeLabel(Number(stored))}` : ""}
                          </span>
                          <input
                            className={`field mt-1 ${isEdited ? "border-amber-300/50" : ""}`}
                            value={shown}
                            spellCheck={false}
                            inputMode={f.kind === "num" ? "numeric" : undefined}
                            onChange={(e) => onInput(f, e.target.value)}
                            onBlur={() => clearDraft(f)}
                          />
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}

          <dl className="mt-3 space-y-1 border-t border-line/70 pt-3 font-mono text-[10px] text-dim">
            <div className="flex justify-between gap-2">
              <dt>grow in</dt>
              <dd className="text-body">{Math.round(((Number(activeValues.growTime) || 0) / 3600) * 10) / 10} h</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>break time</dt>
              <dd className="text-body">{Math.round(((Number(activeValues.hits) || 0) / 6) * 100) / 100} s</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>name bytes</dt>
              <dd className="text-body">{(activeValues.name || "").length}</dd>
            </div>
          </dl>

          <div className="mt-3 flex flex-wrap gap-2">
            {activeNew ? (
              <button type="button" className="btn flex-1 justify-center" onClick={() => removeNew(activeNew.key)}>
                remove item
              </button>
            ) : edits[activeItem.index] ? (
              <button
                type="button"
                className="btn flex-1 justify-center"
                onClick={() => revertItem(activeItem.index)}
              >
                revert this item
              </button>
            ) : null}
          </div>
        </>
      ) : (
        <p className="font-mono text-[11px] text-dim">select a row to edit it, or add an item</p>
      )}
    </aside>
  );

  return (
    <main className="min-w-0 flex-1 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="h2">Items browser</p>
        <h2 className="h3 mt-2">Decode, edit, add and re-encode your items.dat</h2>
        <p className="prose-p mt-3 max-w-3xl">
          One tab, four tools. Everything runs on your computer and nothing is uploaded.
        </p>

        <div className="panel mt-4 flex gap-1 overflow-x-auto p-1">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTool(t.id)}
              className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 font-mono text-[11px] transition ${
                tool === t.id ? "bg-amber-300/15 text-amber-300" : "text-dim hover:text-body"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tool === "decode" ? (
          <>
            <label className="panel mt-4 flex cursor-pointer flex-col items-center gap-2 border-dashed px-4 py-8 text-center transition hover:border-lime/60">
              <span className="font-mono text-xs text-lime">choose items.dat</span>
              <span className="font-mono text-[10px] text-dim">the file stays in your browser</span>
              <input type="file" accept=".dat,application/octet-stream" onChange={onFile} className="sr-only" />
            </label>

            {error ? (
              <p className="panel mt-4 border-red-500/40 px-4 py-3 font-mono text-xs text-red-300">{error}</p>
            ) : null}

            {db ? (
              <>
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ["version", `0x${db.version.toString(16).padStart(2, "0")}`],
                    ["items", allValues.length],
                    ["hash", db.hash],
                    ["bytes", db.size],
                  ].map(([k, v]) => (
                    <div key={k} className="panel px-3 py-2.5">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-dim">{k}</div>
                      <div className="mt-1 break-all font-mono text-sm text-mint">{v}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`chip ${isLossless(db) ? "text-mint" : "text-amber-300"}`}>
                    {isLossless(db) ? "round trip byte-exact" : "partial decode"}
                  </span>
                  <span className="chip">
                    edited items <span className="text-amber-300">{changed.length}</span>
                  </span>
                  <span className="chip">
                    new items <span className="text-lime">{added.length}</span>
                  </span>
                  <span className="chip">
                    output hash <span className="text-body">{outputHash}</span>
                  </span>
                  <span className="chip">
                    size {sizeDelta === 0 ? "unchanged" : `${sizeDelta > 0 ? "+" : ""}${sizeDelta} b`}
                  </span>
                </div>

                {dirty ? (
                  <div className="panel mt-3 flex flex-wrap items-center gap-2 px-3 py-2.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-amber-300">
                      {dirty} unsaved change{dirty === 1 ? "" : "s"}
                    </span>
                    <span className="font-mono text-[10px] text-dim">
                      {changed.length} edited row{changed.length === 1 ? "" : "s"} · {added.length} added
                    </span>
                    <button
                      type="button"
                      className="btn ml-auto"
                      onClick={() => {
                        setEdits({});
                        setAdded([]);
                        setDrafts({});
                        setSelected(db.list[0] ? { type: "item", index: 0 } : null);
                      }}
                    >
                      discard everything
                    </button>
                  </div>
                ) : null}

                <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_22rem]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <input
                        className="field flex-1"
                        placeholder="search by name, exact id or type, e.g. dirt / 2 / seed"
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          setLimit(100);
                        }}
                      />
                      <button type="button" className="btn" onClick={() => addItem("blank")}>
                        + add item
                      </button>
                      <button type="button" className="btn" onClick={() => addItem("duplicate")}>
                        duplicate
                      </button>
                    </div>

                    <p className="mt-2 font-mono text-[10px] text-dim">
                      {rows.length} match{rows.length === 1 ? "" : "es"}
                      {changed.length ? ` · ${changed.length} edited` : ""}
                      {added.length ? ` · ${added.length} new` : ""}
                    </p>

                    {added.length ? (
                      <div className="panel mt-2 flex flex-wrap items-center gap-1.5 px-3 py-2.5">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-lime">new</span>
                        {added.map((a) => (
                          <span
                            key={a.key}
                            className={`chip ${
                              selected?.type === "new" && selected.key === a.key ? "border-lime/60 text-lime" : ""
                            }`}
                          >
                            <button type="button" onClick={() => setSelected({ type: "new", key: a.key })}>
                              {a.values.name || "Custom Item"}
                            </button>
                            <span className="text-dim/60">#{a.values.id}</span>
                            <button
                              type="button"
                              className="text-dim hover:text-red-300"
                              onClick={() => removeNew(a.key)}
                              title="remove this new item"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="panel mt-2 overflow-x-auto">
                      <table className="w-full min-w-[34rem] text-left">
                        <thead className="border-b border-line font-mono text-[10px] uppercase tracking-wider text-dim">
                          <tr>
                            {["id", "name", "type", "hits", "reset", "rarity", "grow s"].map((h) => (
                              <th key={h} className="px-3 py-2">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="font-mono text-[11px]">
                          {rows.slice(0, limit).map((it) => {
                            const e = edits[it.index];
                            const isActive = selected?.type === "item" && selected.index === it.index;
                            return (
                              <tr
                                key={it.index}
                                onClick={() => setSelected({ type: "item", index: it.index })}
                                className={`cursor-pointer border-t border-line/70 transition ${
                                  isActive ? "bg-mint/10" : "hover:bg-panel2"
                                }`}
                              >
                                <td className="px-3 py-2 text-mint">{e?.id ?? it.id}</td>
                                <td className="px-3 py-2 text-body">
                                  {e?.name ?? it.name}
                                  {e ? <span className="ml-1.5 text-amber-300">*</span> : null}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-dim">{typeLabel(e?.type ?? it.type)}</td>
                                <td className="px-3 py-2 text-dim">{e?.hits ?? it.rawHits}</td>
                                <td className="px-3 py-2 text-dim">{e?.hitReset ?? it.hitReset}</td>
                                <td className="px-3 py-2 text-dim">{e?.rarity ?? it.rarity}</td>
                                <td className="px-3 py-2 text-dim">{e?.growTime ?? it.growTime}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {rows.length > limit ? (
                      <button type="button" className="btn mt-3" onClick={() => setLimit(limit + 200)}>
                        show 200 more
                      </button>
                    ) : null}
                  </div>

                  {editorPanel}
                </div>

                <div className="panel mt-4 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-mint">import items</span>
                    <span className="font-mono text-[10px] text-dim">
                      JSON (this site&apos;s or GrowTools&apos;) or a GrowTools TXT
                    </span>
                    <label className="btn ml-auto cursor-pointer">
                      load from file
                      <input
                        type="file"
                        accept=".json,.txt,application/json,text/plain"
                        className="sr-only"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) setImportText(await file.text());
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>

                  <textarea
                    className="field mt-2 h-40 resize-y leading-5"
                    spellCheck={false}
                    placeholder={importPlaceholder}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                  />

                  <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] text-dim">
                    <div className="flex overflow-hidden rounded-lg border border-line2">
                      {[
                        ["patch", "patch from here"],
                        ["append", "append as new"],
                      ].map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setImportMode(id)}
                          className={`px-2.5 py-1 ${importMode === id ? "bg-mint/15 text-mint" : "text-dim hover:text-body"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {importMode === "patch" ? (
                      <>
                        <div className="flex overflow-hidden rounded-lg border border-line2">
                          {[
                            ["index", "index"],
                            ["id", "item id"],
                          ].map(([id, label]) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setImportFromKind(id)}
                              className={`px-2.5 py-1 ${
                                importFromKind === id ? "bg-mint/15 text-mint" : "text-dim hover:text-body"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <label className="flex items-center gap-1.5">
                          start at
                          <input
                            className="field w-20 py-1"
                            value={importFrom}
                            onChange={(e) => setImportFrom(e.target.value)}
                          />
                        </label>
                        <span className="text-dim/70">→ applies to the last item; extra entries are appended</span>
                      </>
                    ) : (
                      <span className="text-dim/70">new ids continue after the last item</span>
                    )}

                    <button type="button" className="btn border-lime/40 text-lime" onClick={applyImport}>
                      apply import
                    </button>
                  </div>

                  {importMsg ? <p className="mt-2 font-mono text-[10px] text-amber-300">{importMsg}</p> : null}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="btn border-lime/40 text-lime"
                    onClick={() => download(output, "items.dat")}
                  >
                    download items.dat
                  </button>
                  <button type="button" className="btn" onClick={exportJson}>
                    download items.json
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => download(itemsToTxt(db, allValues), "items.txt", "text/plain")}
                  >
                    download items.txt
                  </button>
                  <button type="button" className="btn" onClick={() => setShowJson((v) => !v)}>
                    {showJson ? "hide json" : "preview json"}
                  </button>
                </div>

                <p className="mt-2 font-mono text-[10px] leading-5 text-dim">
                  the server sends these bytes on refresh_item_data and advertises the hash in
                  OnSuperMainStartAcceptLogon, so the hash above is the one to match after editing.
                  {output ? ` first bytes: ${hexOf(output.subarray(0, 8))}` : ""}
                </p>

                {showJson ? (
                  <pre className="panel mt-3 max-h-80 overflow-auto px-4 py-3 font-mono text-[11px] leading-5 text-body/80">
                    {JSON.stringify(
                      {
                        version: db.version,
                        itemCount: allValues.length,
                        items: allValues.slice(0, 20).map((v, i) => valuesToJson(db.list[i] ?? { index: i }, v)),
                      },
                      null,
                      2,
                    )}
                    {allValues.length > 20 ? `\n… ${allValues.length - 20} more items` : ""}
                  </pre>
                ) : null}
              </>
            ) : null}
          </>
        ) : null}

        {tool === "add" ? (
          <>
            {db ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_22rem]">
                <div className="min-w-0">
                  <div className="panel p-4">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-mint">new item</div>
                    <p className="mt-2 font-mono text-[10px] leading-5 text-dim">
                      Added after item #{db.list.length - 1} of {db.count}. Ids continue in order and the item count in
                      the header is rewritten when you download. The name is XORed with the new id, so it stays
                      readable in game.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" className="btn border-lime/40 text-lime" onClick={() => addItem("blank")}>
                        + blank item
                      </button>
                      <button type="button" className="btn" onClick={() => addItem("duplicate")}>
                        duplicate selected
                      </button>
                      <span className="chip">
                        total after saving <span className="text-body">{db.count + added.length}</span>
                      </span>
                    </div>
                  </div>

                  <div className="panel mt-3 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-dim">
                        your new items
                      </span>
                      <span className="font-mono text-[10px] text-lime">{added.length}</span>
                    </div>
                    {added.length ? (
                      <ul className="mt-2 divide-y divide-line/70">
                        {added.map((a) => (
                          <li key={a.key} className="flex items-center gap-2 py-2">
                            <button
                              type="button"
                              className={`min-w-0 flex-1 truncate text-left font-mono text-[11px] ${
                                selected?.type === "new" && selected.key === a.key ? "text-lime" : "text-body"
                              }`}
                              onClick={() => setSelected({ type: "new", key: a.key })}
                            >
                              {a.values.name || "Custom Item"}
                            </button>
                            <span className="font-mono text-[10px] text-dim">
                              #{a.values.id} · {typeLabel(Number(a.values.type))}
                            </span>
                            <button
                              type="button"
                              className="font-mono text-[11px] text-dim hover:text-red-300"
                              onClick={() => removeNew(a.key)}
                            >
                              remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 font-mono text-[10px] text-dim">
                        nothing added yet — a blank item is a foreground block with collision and a stack of 200.
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn border-lime/40 text-lime"
                      onClick={() => download(output, "items.dat")}
                    >
                      download items.dat
                    </button>
                    <button type="button" className="btn" onClick={exportJson}>
                      download items.json
                    </button>
                    {added.length ? (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          setAdded([]);
                          setSelected(db.list[0] ? { type: "item", index: 0 } : null);
                        }}
                      >
                        remove all new items
                      </button>
                    ) : null}
                  </div>
                </div>

                {editorPanel}
              </div>
            ) : (
              <div className="panel mt-4 flex flex-wrap items-center gap-3 px-4 py-6">
                <p className="font-mono text-xs text-dim">
                  load an items.dat first — the layout comes from the file, so a new item can only be written after a
                  file is open.
                </p>
                <button type="button" className="btn border-lime/40 text-lime" onClick={() => setTool("decode")}>
                  open the decoder
                </button>
              </div>
            )}
          </>
        ) : null}

        {tool === "hash" ? (
          <div className="panel mt-4 p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-mint">proton hash</div>
            <p className="prose-p mt-2 max-w-2xl text-[13px]">
              Hash any file the way the client hashes items.dat, RTTEX and RTFONT. The same bytes must produce the
              same number the server advertises, so this is a quick way to check a file before uploading it.
            </p>
            <label className="btn mt-3 cursor-pointer">
              choose a file
              <input type="file" className="sr-only" onChange={hashFile} />
            </label>
            {fileHash ? (
              <div className="mt-3 break-all font-mono text-[11px] text-body">
                <div className="text-dim">
                  {fileHash.name} · {fileHash.size} bytes
                </div>
                <div className="mt-1 text-lg text-mint">{fileHash.hash}</div>
              </div>
            ) : null}
          </div>
        ) : null}

        {tool === "rttex" ? (
          <div className="panel mt-4 p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-mint">rttex ⇄ png</div>
            <p className="prose-p mt-2 max-w-2xl text-[13px]">
              Convert a texture from the game&apos;s cache. RTPACK containers are unpacked first; the reverse writes a
              packed .rttex with the same header the game expects.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="btn cursor-pointer">
                rttex → png
                <input type="file" accept=".rttex" className="sr-only" onChange={rttexIn} />
              </label>
              <label className="btn cursor-pointer">
                image → rttex
                <input type="file" accept="image/*" className="sr-only" onChange={rttexOut} />
              </label>
            </div>
            {rtMsg ? <p className="mt-3 font-mono text-[10px] text-red-300">{rtMsg}</p> : null}
            {rt ? (
              <div className="mt-3">
                {rt.url ? (
                  <img src={rt.url} alt={rt.name} className="max-h-80 rounded-lg border border-line" />
                ) : null}
                <div className="mt-2 break-all font-mono text-[10px] text-dim">{rt.note}</div>
                <button type="button" className="btn mt-2" onClick={() => download(rt.blob, rt.name)}>
                  download {rt.name}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
