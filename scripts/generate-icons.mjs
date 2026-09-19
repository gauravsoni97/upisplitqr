import { deflateSync } from 'zlib';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([len, name, data, crc]);
}

function writePng(size, colorAt) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a = 255] = colorAt(x, y, size);
      const i = y * stride + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function inRect(x, y, l, t, r, b) {
  return x >= l && x < r && y >= t && y < b;
}

function drawIcon(x, y, size) {
  const pad = size * 0.08;
  const radius = size * 0.22;
  const dx = Math.min(x, size - 1 - x);
  const dy = Math.min(y, size - 1 - y);
  const outside =
    (x < pad || x >= size - pad || y < pad || y >= size - pad) &&
    (dx < pad || dy < pad) &&
    (pad - Math.min(dx, pad)) ** 2 + (pad - Math.min(dy, pad)) ** 2 > radius ** 2;

  if (outside) return [0, 0, 0, 0];

  const s = (v) => Math.round(v * size);
  const finder = (fx, fy) => {
    const o = s(0.18);
    const i = s(0.28);
    const c = s(0.36);
    const e = s(0.46);
    if (inRect(x, y, s(fx) + o, s(fy) + o, s(fx) + e, s(fy) + e)) {
      if (inRect(x, y, s(fx) + i, s(fy) + i, s(fx) + c + s(0.1), s(fy) + c + s(0.1))) return [5, 150, 105, 255];
      return [255, 255, 255, 255];
    }
    return null;
  };

  return finder(0.12, 0.12) || finder(0.54, 0.12) || finder(0.12, 0.54) || [5, 150, 105, 255];
}

for (const size of [192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), writePng(size, drawIcon));
}

console.log('Wrote PWA icons');
