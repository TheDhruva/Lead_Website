/**
 * Generates the site's static film-grain tile:
 * a deliberately small (144px) tileable grayscale noise PNG.
 *
 * Rationale: the previous grain was an inline SVG feTurbulence surface
 * composited fullscreen on every scrolled frame. A tiny opaque noise PNG
 * with background-repeat + low CSS opacity is rasterized once, cached by
 * the browser (immutable headers, see next.config.ts), and costs a single
 * cheap texture sample per pixel instead of a procedural filter.
 *
 * Deterministic (seeded PRNG) so builds are reproducible.
 * Run: `node scripts/generate-grain-tile.mjs`
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const SIZE = 144;

let seed = 20261007;
/** mulberry32 — deterministic, no dependencies. */
function rand() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Minimal CRC32 (IEEE) for PNG chunks. */
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([len, typeBytes, data, crc]);
}

// Mid-gray-centered noise: values cluster around 128 so the tile reads as
// neutral paper grain at low CSS opacity over both themes.
const raw = Buffer.alloc(SIZE * (SIZE + 1));
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE + 1)] = 0; // filter type 0 (None) per scanline
  for (let x = 0; x < SIZE; x++) {
    const v = Math.round(128 + (rand() - 0.5) * 96);
    raw[y * (SIZE + 1) + 1 + x] = Math.max(0, Math.min(255, v));
  }
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 0; // color type: grayscale
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // no interlace

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const outDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "images",
);
writeFileSync(join(outDir, "grain-tile.png"), png);
console.log(
  `grain-tile.png written (${png.length} bytes, ${SIZE}x${SIZE} grayscale)`,
);
