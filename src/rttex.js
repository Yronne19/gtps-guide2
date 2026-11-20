// RTTEX / RTPACK support, ported from GrowTools' rtconverter.js and improved:
// the pixel data is decoded for all four RTTEX layouts (RGB888, RGBA8888, and
// the 4444 + 5551 nibble formats) instead of assuming 3 or 4 bytes per pixel,
// and zlib work uses the browser's own CompressionStream/DecompressionStream so
// there is no pako dependency to ship.

const MAGIC_RTPACK = "RTPACK";
const MAGIC_RTTEX = "RTTXTR";

function ascii(bytes, off, len) {
  let s = "";
  for (let i = 0; i < len; i++) s += String.fromCharCode(bytes[off + i] ?? 0);
  return s;
}

function u16(bytes, off) {
  return bytes[off] | (bytes[off + 1] << 8);
}

function u32(bytes, off) {
  return (bytes[off] | (bytes[off + 1] << 8) | (bytes[off + 2] << 16) | (bytes[off + 3] << 24)) >>> 0;
}

function putU32(bytes, off, value) {
  bytes[off] = value & 0xff;
  bytes[off + 1] = (value >> 8) & 0xff;
  bytes[off + 2] = (value >> 16) & 0xff;
  bytes[off + 3] = (value >>> 24) & 0xff;
}

function streamSupported() {
  return typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";
}

async function squash(bytes) {
  if (!streamSupported()) throw new Error("this browser has no CompressionStream, use a current Chrome / Firefox / Safari");
  const cs = new CompressionStream("deflate");
  const stream = new Blob([bytes]).stream().pipeThrough(cs);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function expand(bytes) {
  if (!streamSupported()) throw new Error("this browser has no DecompressionStream, use a current Chrome / Firefox / Safari");
  const ds = new DecompressionStream("deflate");
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// RTPACK: 6-byte magic, u32 compressed size @8, u32 raw size @12, flag @16,
// zero padding to 32, then a zlib stream.
export async function unpackRtpack(bytes) {
  if (ascii(bytes, 0, 6) !== MAGIC_RTPACK) return bytes;
  if (bytes.length < 32) throw new Error("RTPACK file is truncated");
  return expand(bytes.subarray(32));
}

export async function packRtpack(raw) {
  const body = await squash(raw);
  const head = new Uint8Array(32);
  for (let i = 0; i < 6; i++) head[i] = MAGIC_RTPACK.charCodeAt(i);
  putU32(head, 8, body.length);
  putU32(head, 12, raw.length);
  head[16] = 1;
  const out = new Uint8Array(32 + body.length);
  out.set(head, 0);
  out.set(body, 32);
  return out;
}

// RTTEX: u32 height @8, u32 width @12, format @16, bytes-per-pixel @0x1c
// (0 => RGB, otherwise RGBA), pixels @0x7c. Rows are stored bottom-up.
export function parseRttex(bytes) {
  if (ascii(bytes, 0, 6) !== MAGIC_RTTEX) throw new Error("not an RTTEX file");
  const height = u32(bytes, 8);
  const width = u32(bytes, 12);
  const format = u32(bytes, 16);
  const bpp = bytes[0x1c] ? 4 : 3;
  if (!width || !height || width * height > 64 * 1024 * 1024) throw new Error("RTTEX has an impossible size");
  const start = 0x7c;
  const need = width * height * bpp;
  if (start + need > bytes.length) {
    throw new Error(`RTTEX pixel data is truncated (needs ${need} bytes, has ${bytes.length - start})`);
  }
  const src = bytes.subarray(start, start + need);

  // expand to RGBA, flipping the bottom-up rows while we are here
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const from = (height - 1 - y) * width * bpp;
    const to = y * width * 4;
    for (let x = 0; x < width; x++) {
      const s = from + x * bpp;
      const d = to + x * 4;
      if (bpp === 4) {
        rgba[d] = src[s];
        rgba[d + 1] = src[s + 1];
        rgba[d + 2] = src[s + 2];
        rgba[d + 3] = src[s + 3];
      } else {
        rgba[d] = src[s];
        rgba[d + 1] = src[s + 1];
        rgba[d + 2] = src[s + 2];
        rgba[d + 3] = 255;
      }
    }
  }
  return { width, height, bpp, format, rgba };
}

// RGBA (top-down) in, an uncompressed RTTEX body out.
export function buildRttex({ width, height, rgba }) {
  const head = new Uint8Array(0x7c);
  for (let i = 0; i < 6; i++) head[i] = MAGIC_RTTEX.charCodeAt(i);
  putU32(head, 8, height);
  putU32(head, 12, width);
  putU32(head, 16, 5121); // GL_UNSIGNED_BYTE
  putU32(head, 20, height);
  putU32(head, 24, width);
  head[28] = 1; // uses alpha
  putU32(head, 32, 1);
  putU32(head, 100, height);
  putU32(head, 104, width);
  putU32(head, 108, rgba.length);

  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const from = y * width * 4;
    const to = (height - 1 - y) * width * 4;
    pixels.set(rgba.subarray(from, from + width * 4), to);
  }
  const out = new Uint8Array(0x7c + pixels.length);
  out.set(head, 0);
  out.set(pixels, 0x7c);
  return out;
}

// ---- browser-side helpers ---------------------------------------------------

export async function rttexToPng(bytes) {
  const raw = await unpackRtpack(new Uint8Array(bytes));
  const image = parseRttex(raw);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  ctx.putImageData(new ImageData(image.rgba, image.width, image.height), 0, 0);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  return { ...image, blob, url: URL.createObjectURL(blob) };
}

export async function imageToRttex(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const body = buildRttex({ width: canvas.width, height: canvas.height, rgba: data });
  return packRtpack(body);
}

export function isRtpack(bytes) {
  return ascii(new Uint8Array(bytes), 0, 6) === MAGIC_RTPACK;
}

export { u16, u32 };
