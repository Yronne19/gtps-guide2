// items.dat codec, ported from GrowTools' items_tools.js (item_decoder /
// item_encoder) and the layout walk in src/items.cpp, then tightened for the
// browser:
//
//  * every read is bounds-checked, so a wrong or newer file throws instead of
//    producing garbage;
//  * instead of rebuilding every field from scratch, the decoder records the byte
//    span of each field, so encoding writes the original bytes back untouched and
//    only the fields you edited are re-emitted. A file you do not edit is
//    byte-identical after a round trip;
//  * any field can be edited (GrowTools exposes them all), items can be appended
//    and the item count in the header is rewritten for you;
//  * JSON and the GrowTools `\`-separated TXT format can both be imported, and
//    GrowTools' field names are accepted as aliases.

export const KEY = "PBG892FXX982ABC*"; // XOR key that hides item names

export const TYPES = {
  0: "FIST",
  1: "WRENCH",
  2: "DOOR",
  3: "LOCK",
  4: "GEM",
  8: "CONSUMEABLE",
  13: "MAIN_DOOR",
  14: "PLATFORM",
  15: "STRONG",
  17: "FOREGROUND",
  18: "BACKGROUND",
  19: "SEED",
  20: "CLOTHING",
};

export function typeLabel(type) {
  return TYPES[type] ?? "0x" + Number(type).toString(16);
}

// proton_hash: the "hash" the client is told to expect for items.dat.
export function protonHash(bytes) {
  let h = 0x55555555;
  for (let i = 0; i < bytes.length; i++) h = (h >>> 27) + (h << 5) + bytes[i];
  return h >>> 0;
}

function numberBytes(value, len) {
  const v = Number(value) || 0;
  const out = new Uint8Array(len);
  for (let a = 0; a < len; a++) {
    if (a < 4) out[a] = (v >> (a * 8)) & 0xff;
    else out[a] = ((Math.floor(v / Math.pow(2, a * 8)) % 256) + 256) % 256;
  }
  return out;
}

export function hexOf(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0");
  return s.toUpperCase();
}

export function hexToBytes(hex, len) {
  const clean = String(hex || "").replace(/[^0-9a-fA-F]/g, "");
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    const pair = clean.slice(i * 2, i * 2 + 2);
    out[i] = pair.length === 2 ? parseInt(pair, 16) : 0;
  }
  return out;
}

export function decodeItems(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let pos = 0;

  const need = (n) => {
    if (pos + n > bytes.length) {
      throw new Error("items.dat ended early or has an unsupported layout");
    }
  };

  const version = view.getUint16(0, true);
  const count = view.getUint32(2, true);
  if (count > 100000) throw new Error("item count looks wrong, wrong file?");
  if (version === 0 || version > 0x1b) {
    throw new Error(`items.dat version 0x${version.toString(16)} is not supported (expected up to 0x1b)`);
  }
  pos = 6;

  const readNum = (f, signed = false) => {
    if (f.len === 1) return bytes[f.off];
    if (f.len === 2) return signed ? view.getInt16(f.off, true) : view.getUint16(f.off, true);
    if (f.len === 4) return signed ? view.getInt32(f.off, true) : view.getUint32(f.off, true);
    return 0;
  };

  const list = [];
  const itemStarts = [];

  for (let n = 0; n < count; n++) {
    const start = pos;
    itemStarts.push(start);
    const fields = [];

    const take = (tag, len) => {
      need(len);
      const f = { kind: "raw", tag, off: pos, len };
      fields.push(f);
      pos += len;
      return f;
    };

    // A length-prefixed string: u16 length, then the bytes. `xorId` marks the
    // name field, which is XORed with the key using the item id as offset.
    const text = (tag, xorId) => {
      need(2);
      const lenOff = pos;
      const len = view.getUint16(pos, true);
      pos += 2;
      need(len);
      const f = { kind: "str", tag, lenOff, off: pos, len, xorId };
      fields.push(f);
      let s = "";
      for (let i = 0; i < len; i++) {
        const b = bytes[pos + i];
        s += String.fromCharCode(
          xorId === undefined ? b : b ^ KEY.charCodeAt((i + xorId) % KEY.length),
        );
      }
      pos += len;
      return { span: f, value: s };
    };

    const idSpan = take("id", 4);
    const id = readNum(idSpan) & 0xffff;

    const prop = readNum(take("prop", 1)); // editable / property
    const category = readNum(take("category", 1));
    const type = readNum(take("type", 1));
    const material = readNum(take("material", 1));
    const name = text("name", id).value;
    const texture = text("texture").value;
    const textureHash = readNum(take("textureHash", 4));
    const itemKind = readNum(take("itemKind", 1));
    const val1 = readNum(take("val1", 4));
    const tx = readNum(take("tx", 1));
    const ty = readNum(take("ty", 1));
    const spread = readNum(take("spread", 1));
    const stripey = readNum(take("stripey", 1));
    const collision = readNum(take("collision", 1));
    const rawHits = readNum(take("hits", 1));
    const hitReset = readNum(take("hitReset", 4));
    const clothing = readNum(take("clothing", 1));
    const rarity = readNum(take("rarity", 2), true);
    const maxAmount = readNum(take("maxAmount", 1));
    const extraFile = text("extraFile").value;
    const extraFileHash = readNum(take("extraFileHash", 4));
    const audioVolume = readNum(take("audioVolume", 4));
    const petName = text("petName").value;
    const petPrefix = text("petPrefix").value;
    const petSuffix = text("petSuffix").value;
    const petAbility = text("petAbility").value;
    const seedBase = readNum(take("seedBase", 1));
    const seedOverlay = readNum(take("seedOverlay", 1));
    const treeBase = readNum(take("treeBase", 1));
    const treeLeaves = readNum(take("treeLeaves", 1));
    take("seedColor", 4);
    take("seedOverlayColor", 4);
    take("ingredients", 4);
    const growTime = readNum(take("growTime", 4));
    const val2 = readNum(take("val2", 2));
    const rayman = readNum(take("rayman", 2));
    const extraOptions = text("extraOptions").value;
    const texture2 = text("texture2").value;
    const extraOptions2 = text("extraOptions2").value;
    take("blob80", 80);

    // ---- version tail: opaque spans, kept as raw bytes on purpose ----
    // (GrowTools re-encodes these from parsed numbers and can drift; copying the
    // span keeps every version byte-exact. See the header note.)
    if (version >= 0x0b) text("punchOptions");
    if (version >= 0x0c) take("d12", 13);
    if (version >= 0x0d) take("i13", 4);
    if (version >= 0x0e) take("i14", 4);
    if (version >= 0x0f) {
      take("d15", 25);
      text("s15");
    }
    if (version >= 0x10) text("s16");
    if (version >= 0x11) take("i17", 4);
    if (version >= 0x12) take("i18", 4);
    if (version >= 0x13) take("i19", 9);
    if (version >= 0x15) take("i21", 2);
    const info = version >= 0x16 ? text("info").value : "";
    if (version >= 0x17) take("i24", 4);
    if (version >= 0x18) take("i25", 1);
    if (version >= 0x19) {
      // gurotopia only skips the string when its length is greater than 6;
      // length prefix + optional string + 4-byte hash are one opaque span.
      const mark = fields.length;
      const blobStart = pos;
      const len = readNum(take("_v25len", 2));
      if (len > 6) take("_v25", len);
      take("_v25hash", 4);
      fields.length = mark;
      fields.push({ kind: "raw", tag: "v25", off: blobStart, len: pos - blobStart });
    }
    if (version >= 0x1a) take("i26", 1);
    if (version === 0x1b) {
      const mark = fields.length;
      const blobStart = pos;
      const len = readNum(take("_v27len", 2));
      if (len > 0) take("_v27", 1);
      fields.length = mark;
      fields.push({ kind: "raw", tag: "v27", off: blobStart, len: pos - blobStart });
    }

    list.push({
      index: n,
      start,
      end: pos,
      fields,
      id,
      prop,
      category,
      type,
      material,
      name,
      texture,
      textureHash,
      itemKind,
      val1,
      tx,
      ty,
      spread,
      stripey,
      collision,
      rawHits,
      // rawHits is the byte in the file; hits is the human "seconds" reading,
      // which is why the exported JSON carries both.
      hits: rawHits ? Math.floor(rawHits / 6) : 0,
      hitReset,
      clothing,
      rarity,
      maxAmount,
      extraFile,
      extraFileHash,
      audioVolume,
      petName,
      petPrefix,
      petSuffix,
      petAbility,
      seedBase,
      seedOverlay,
      treeBase,
      treeLeaves,
      growTime,
      val2,
      rayman,
      extraOptions,
      texture2,
      extraOptions2,
      info,
    });
  }

  const db = {
    version,
    count,
    size: bytes.length,
    bytes,
    list,
    tailStart: pos,
    headerEnd: itemStarts[0] ?? 6,
  };
  db.hash = protonHash(bytes);
  return db;
}

// Every field the editor can touch, with the label and grouping the UI uses.
// `kind` decides how a value is stored: str -> text, num -> integer, hex -> bytes.
export const FIELD_META = {
  id: { label: "id", group: "identity", kind: "num", hint: "position in the file; the name is XORed with it" },
  prop: { label: "property", group: "identity", kind: "num", hint: "editable flag" },
  category: { label: "category", group: "identity", kind: "num" },
  type: { label: "type", group: "identity", kind: "num" },
  material: { label: "material", group: "identity", kind: "num", hint: "hit sound type" },
  name: { label: "name", group: "identity", kind: "str" },

  texture: { label: "texture", group: "texture", kind: "str" },
  textureHash: { label: "texture hash", group: "texture", kind: "num" },
  itemKind: { label: "item kind", group: "texture", kind: "num" },
  val1: { label: "val1", group: "texture", kind: "num" },
  tx: { label: "tex x", group: "texture", kind: "num" },
  ty: { label: "tex y", group: "texture", kind: "num" },
  spread: { label: "spread", group: "texture", kind: "num" },
  stripey: { label: "stripey", group: "texture", kind: "num" },

  collision: { label: "collision", group: "gameplay", kind: "num" },
  hits: { label: "break hits", group: "gameplay", kind: "num", hint: "raw byte; break time = value / 6 s" },
  hitReset: { label: "break reset", group: "gameplay", kind: "num" },
  clothing: { label: "clothing", group: "gameplay", kind: "num" },
  rarity: { label: "rarity", group: "gameplay", kind: "num", hint: "signed short" },
  maxAmount: { label: "max stack", group: "gameplay", kind: "num" },
  growTime: { label: "grow time", group: "gameplay", kind: "num", hint: "seconds" },

  extraFile: { label: "extra file", group: "media", kind: "str" },
  extraFileHash: { label: "extra hash", group: "media", kind: "num" },
  audioVolume: { label: "audio volume", group: "media", kind: "num" },

  petName: { label: "pet name", group: "pet", kind: "str" },
  petPrefix: { label: "pet prefix", group: "pet", kind: "str" },
  petSuffix: { label: "pet suffix", group: "pet", kind: "str" },
  petAbility: { label: "pet ability", group: "pet", kind: "str" },

  seedBase: { label: "seed base", group: "farming", kind: "num" },
  seedOverlay: { label: "seed overlay", group: "farming", kind: "num" },
  treeBase: { label: "tree base", group: "farming", kind: "num" },
  treeLeaves: { label: "tree leaves", group: "farming", kind: "num" },
  seedColor: { label: "seed colour", group: "farming", kind: "hex", hint: "ARGB bytes" },
  seedOverlayColor: { label: "overlay colour", group: "farming", kind: "hex", hint: "ARGB bytes" },
  ingredients: { label: "ingredients", group: "farming", kind: "hex", hint: "4 opaque bytes" },

  extraOptions: { label: "extra options", group: "text", kind: "str" },
  texture2: { label: "texture2", group: "text", kind: "str" },
  extraOptions2: { label: "extra options2", group: "text", kind: "str" },
  info: { label: "info", group: "text", kind: "str", hint: "shown in the item description" },

  blob80: { label: "data [80]", group: "raw", kind: "hex" },
  punchOptions: { label: "punch options", group: "raw", kind: "str" },
  d12: { label: "v12 data [13]", group: "raw", kind: "hex" },
  i13: { label: "v13 int", group: "raw", kind: "num" },
  i14: { label: "v14 int", group: "raw", kind: "num" },
  d15: { label: "v15 data [25]", group: "raw", kind: "hex" },
  s15: { label: "v15 string", group: "raw", kind: "str" },
  s16: { label: "v16 string", group: "raw", kind: "str" },
  i17: { label: "v17 int", group: "raw", kind: "num" },
  i18: { label: "v18 int", group: "raw", kind: "num" },
  i19: { label: "v19 data [9]", group: "raw", kind: "hex" },
  i21: { label: "v21 int", group: "raw", kind: "num" },
  i24: { label: "v23 data [4]", group: "raw", kind: "hex" },
  i25: { label: "v24 int", group: "raw", kind: "num" },
  v25: { label: "v25 sound + hash", group: "raw", kind: "hex" },
  i26: { label: "v26 int", group: "raw", kind: "num" },
  v27: { label: "v27 data", group: "raw", kind: "hex" },
};

export const GROUPS = [
  { id: "identity", label: "identity", open: true },
  { id: "texture", label: "texture", open: true },
  { id: "gameplay", label: "gameplay", open: true },
  { id: "media", label: "media", open: false },
  { id: "pet", label: "pet", open: false },
  { id: "farming", label: "farming", open: false },
  { id: "text", label: "strings", open: false },
  { id: "raw", label: "raw / version tail", open: false },
];

// GrowTools' field names, so their items.json and items.txt both import.
const ALIASES = {
  item_id: "id",
  editable_type: "prop",
  item_category: "category",
  action_type: "type",
  hit_sound_type: "material",
  texture_hash: "textureHash",
  item_kind: "itemKind",
  texture_x: "tx",
  texture_y: "ty",
  spread_type: "spread",
  is_stripey_wallpaper: "stripey",
  collision_type: "collision",
  break_hits: "hits",
  drop_chance: "hitReset",
  clothing_type: "clothing",
  max_amount: "maxAmount",
  extra_file: "extraFile",
  extra_file_hash: "extraFileHash",
  audio_volume: "audioVolume",
  pet_name: "petName",
  pet_prefix: "petPrefix",
  pet_suffix: "petSuffix",
  pet_ability: "petAbility",
  seed_base: "seedBase",
  seed_overlay: "seedOverlay",
  tree_base: "treeBase",
  tree_leaves: "treeLeaves",
  seed_color: "seedColor",
  seed_overlay_color: "seedOverlayColor",
  grow_time: "growTime",
  is_rayman: "rayman",
  extra_options: "extraOptions",
  extra_options2: "extraOptions2",
  data_position_80: "blob80",
  punch_options: "punchOptions",
  data_version_12: "d12",
  int_version_13: "i13",
  int_version_14: "i14",
  data_version_15: "d15",
  str_version_15: "s15",
  str_version_16: "s16",
  int_version_17: "i17",
  int_version_18: "i18",
  int_version_19: "i19",
  int_version_21: "i21",
  data_version_23: "i24",
  int_version_24: "i25",
  int_version_26: "i26",
  str_version_22: "info",
  hit_sound_fx: "v25",
  hit_sound_fx_hash: "v25hash",
};

const IGNORED_KEYS = new Set(["index", "start", "end", "fields", "hash", "size", "count", "version", "items", "tail"]);

function kindOf(field) {
  return FIELD_META[field.tag]?.kind ?? (field.kind === "str" ? "str" : "hex");
}

// Fields this file actually has, in layout order, ready for the editor.
export function editableFields(db) {
  const tpl = db?.list?.[0];
  if (!tpl) return [];
  return tpl.fields.map((f) => {
    const meta = FIELD_META[f.tag] ?? { label: f.tag, group: "raw", kind: f.kind === "str" ? "str" : "hex" };
    return {
      tag: f.tag,
      label: meta.label,
      group: meta.group,
      kind: meta.kind,
      len: f.kind === "str" ? null : f.len,
      hint: meta.hint,
    };
  });
}

// Everything a value can be read as, keyed by tag. `hits` here is the raw byte
// (what the file stores); use valuesToJson for the human-facing shape.
export function itemValues(db, item) {
  const out = {};
  for (const f of item.fields) {
    if (f.kind === "str") {
      out[f.tag] = item[f.tag] ?? "";
    } else if (kindOf(f) === "hex") {
      out[f.tag] = hexOf(db.bytes.subarray(f.off, f.off + f.len));
    } else {
      // `hits` on a decoded item is the human seconds reading; the file stores rawHits
      out[f.tag] = f.tag === "hits" ? item.rawHits ?? 0 : item[f.tag] ?? 0;
    }
  }
  return out;
}

function emitString(value, xorId) {
  const s = String(value ?? "");
  const data = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    const b = s.charCodeAt(i) & 0xff;
    data[i] = xorId === undefined ? b : b ^ KEY.charCodeAt((i + xorId) % KEY.length);
  }
  const head = new Uint8Array([s.length & 0xff, (s.length >> 8) & 0xff]);
  return [head, data];
}

function buildItemBytes(fields, values, fallbackId) {
  const parts = [];
  const id = values.id !== undefined ? Number(values.id) : fallbackId;
  for (const f of fields) {
    if (f.kind === "str") {
      const xorId = f.xorId === undefined ? undefined : Number(id) || 0;
      parts.push(...emitString(values[f.tag] ?? "", xorId));
    } else if (kindOf(f) === "hex") {
      parts.push(hexToBytes(values[f.tag], f.len));
    } else {
      parts.push(numberBytes(values[f.tag] ?? 0, f.len));
    }
  }
  return parts;
}

// edits:  { [itemIndex]: { [tag]: string | number | Uint8Array } }
// added:  [ { tag: value, ... } ]  (appended items; the count is rewritten)
export function encodeItems(db, edits = {}, additions = []) {
  const src = db.bytes;
  const firstStart = db.list[0]?.start ?? db.headerEnd;
  const parts = [];

  // header: version + rewritten item count + anything before the first item
  parts.push(src.subarray(0, 2), numberBytes(db.list.length + additions.length, 4), src.subarray(6, firstStart));

  for (const item of db.list) {
    const edit = edits[item.index] || {};
    for (const f of item.fields) {
      const next = edit[f.tag];
      if (next === undefined || next === null) {
        // untouched: copy the field exactly as it was read (length prefix too)
        parts.push(f.kind === "str" ? src.subarray(f.lenOff, f.off + f.len) : src.subarray(f.off, f.off + f.len));
      } else if (f.kind === "str") {
        const xorId = f.xorId === undefined ? undefined : Number(edit.id ?? item.id) || 0;
        parts.push(...emitString(next, xorId));
      } else if (next instanceof Uint8Array) {
        if (next.length !== f.len) throw new Error(`field ${f.tag} expects ${f.len} bytes`);
        parts.push(next);
      } else if (kindOf(f) === "hex") {
        parts.push(hexToBytes(next, f.len));
      } else {
        parts.push(numberBytes(next, f.len));
      }
    }
  }

  const tplFields = db.list[0]?.fields ?? [];
  if (additions.length && !tplFields.length) {
    throw new Error("cannot add items: the loaded file has no items to copy the layout from");
  }
  additions.forEach((values, i) => {
    parts.push(...buildItemBytes(tplFields, values, db.list.length + i));
  });

  // trailing bytes after the last item (newer builds sometimes append data)
  if (db.tailStart < src.length) parts.push(src.subarray(db.tailStart));

  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

// True when re-encoding an unedited file reproduces it byte for byte, i.e. the
// decoder understands every byte of this file.
export function isLossless(db) {
  if (!db?._lossless) {
    const again = encodeItems(db);
    let same = again.length === db.bytes.length;
    if (same) {
      for (let i = 0; i < again.length; i++) {
        if (again[i] !== db.bytes[i]) {
          same = false;
          break;
        }
      }
    }
    db._lossless = same;
  }
  return db._lossless;
}

// JSON shape: numeric fields as numbers, opaque bytes as hex, and both the raw
// break-hits byte and the human seconds reading.
export function valuesToJson(item, values) {
  const out = { index: item?.index ?? null };
  const tail = {};
  for (const [tag, val] of Object.entries(values)) {
    if (tag === "hits" || tag === "rawHits" || tag === "v25hash") continue;
    const kind = FIELD_META[tag]?.kind ?? "num";
    if (kind === "hex") tail[tag] = val;
    else out[tag] = val;
  }
  const raw = Number(values.hits ?? 0);
  out.hits = Math.floor(raw / 6);
  out.rawHits = raw;
  if (Object.keys(tail).length) out.tail = tail;
  return out;
}

export function itemToJson(item, db) {
  return valuesToJson(item, itemValues(db, item));
}

export function blankItem(db, index = 0) {
  const tpl = db?.list?.[0];
  if (!tpl) throw new Error("load an items.dat first");
  const values = {};
  for (const f of tpl.fields) {
    if (f.kind === "str") values[f.tag] = "";
    else if (kindOf(f) === "hex") values[f.tag] = "00".repeat(f.len);
    else values[f.tag] = 0;
  }
  values.id = db.list.length + index;
  values.name = "Custom Item";
  // sensible starting point for a custom foreground block
  values.type = 17;
  values.collision = 1;
  values.maxAmount = 200;
  values.hits = 0;
  return values;
}

// ---- import -----------------------------------------------------------------

// One object from JSON / TXT into canonical tag values. Accepts our names and
// GrowTools' names, and the three spellings of break hits.
export function normalizeItemObject(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  const tail = raw.tail && typeof raw.tail === "object" ? raw.tail : null;

  for (const [key, val] of Object.entries(raw)) {
    if (key === "tail" || key === "hits" || key === "rawHits" || IGNORED_KEYS.has(key)) continue;
    const tag = ALIASES[key] ?? key;
    if (val === null || val === undefined) continue;
    const kind = FIELD_META[tag]?.kind;
    if (kind === "num") {
      const n = Number(val);
      if (Number.isFinite(n)) out[tag] = n;
    } else if (kind === "hex") {
      out[tag] = String(val).replace(/\s+/g, "").toUpperCase();
    } else {
      out[tag] = String(val);
    }
  }

  if (raw.rawHits !== undefined && raw.rawHits !== "") out.hits = Number(raw.rawHits);
  else if (typeof raw.hits === "string" && /r$/i.test(raw.hits.trim())) out.hits = parseInt(raw.hits, 10);
  else if (raw.break_hits !== undefined && raw.break_hits !== "") {
    const t = String(raw.break_hits).trim();
    out.hits = /r$/i.test(t) ? parseInt(t, 10) : Number(t) * 6;
  } else if (raw.hits !== undefined && raw.hits !== "") out.hits = Number(raw.hits) * 6;

  if (tail) for (const [key, val] of Object.entries(tail)) out[ALIASES[key] ?? key] = val;
  return out;
}

// Guesses the version of an imported object / returns null when absent.
export function jsonToItems(text) {
  const parsed = JSON.parse(text);
  const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed.items) ? parsed.items : [parsed];
  return arr.map(normalizeItemObject);
}

// The canonical TXT field order (layout order, so it reads like the file).
export const TXT_FIELDS = [
  "id", "prop", "category", "type", "material", "name", "texture", "textureHash", "itemKind", "val1",
  "tx", "ty", "spread", "stripey", "collision", "hits", "hitReset", "clothing", "rarity", "maxAmount",
  "extraFile", "extraFileHash", "audioVolume", "petName", "petPrefix", "petSuffix", "petAbility",
  "seedBase", "seedOverlay", "treeBase", "treeLeaves", "seedColor", "seedOverlayColor", "ingredients",
  "growTime", "val2", "rayman", "extraOptions", "texture2", "extraOptions2", "blob80", "punchOptions",
  "d12", "i13", "i14", "d15", "s15", "s16", "i17", "i18", "i19", "i21", "info", "i24", "i25", "v25", "i26", "v27",
];

function txtValue(values, tag) {
  const val = values[tag];
  if (tag === "hits") return `${Number(val ?? 0)}r`;
  if (val === undefined || val === null) return "";
  return String(val);
}

// GrowTools-compatible TXT: `//Format:` names the columns, so import does not
// depend on column order.
export function itemsToTxt(db, allValues) {
  const lines = [
    "//GrowTools-compatible export, decoded in the browser",
    `//Format: add_item\\${TXT_FIELDS.join("\\")}`,
    "//break hits: append r to keep the raw byte (18r); a plain number is multiplied by 6",
    "",
    `version\\${db.version}`,
    `itemCount\\${allValues.length}`,
    "",
  ];
  for (const values of allValues) {
    lines.push("add_item\\" + TXT_FIELDS.map((t) => txtValue(values, t)).join("\\"));
  }
  return lines.join("\n") + "\n";
}

export function txtToItems(text) {
  const lines = String(text).split(/\r?\n/);
  let keys = null;
  const items = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("//")) {
      if (trimmed.startsWith("//Format:")) {
        const cols = trimmed.slice("//Format:".length).trim().split("\\").map((s) => s.trim()).filter(Boolean);
        // GrowTools includes the literal "add_item" as the first column name
        keys = cols[0] === "add_item" ? cols.slice(1) : cols;
      }
      continue;
    }
    const parts = trimmed.split("\\");
    if (parts[0] === "add_item") {
      const obj = {};
      const cols = keys ?? TXT_FIELDS;
      for (let i = 0; i < cols.length; i++) obj[cols[i]] = parts[i + 1] ?? "";
      items.push(normalizeItemObject(obj));
    }
  }
  return items;
}
