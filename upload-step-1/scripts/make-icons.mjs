// Draws the app icon (the squatting mascot on a halftone "sun", in the poster
// colors) and saves it as PNG files in public/icons/. Phones use these for the
// home-screen icon. Uses only Node's built-in modules, so nothing to install.
//
// Run with: node scripts/make-icons.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const PAPER = [246, 236, 220];
const INK = [38, 40, 90];
const RED = [201, 79, 49];
const SOFT_RED = [227, 150, 127];

// The mascot's squat pose, in the same 200 x 260 box as PoseFigure.jsx.
const POSE = {
  head: [100, 84],
  neck: [100, 110],
  lShoulder: [76, 118],
  rShoulder: [124, 118],
  lElbow: [50, 112],
  rElbow: [150, 112],
  lWrist: [26, 106],
  rWrist: [174, 106],
  lHip: [84, 180],
  rHip: [116, 180],
  lKnee: [62, 198],
  rKnee: [138, 198],
  lAnkle: [80, 240],
  rAnkle: [120, 240],
};
const BONES = [
  ['neck', 'head'], ['lShoulder', 'rShoulder'], ['lShoulder', 'lElbow'], ['lElbow', 'lWrist'],
  ['rShoulder', 'rElbow'], ['rElbow', 'rWrist'], ['lShoulder', 'lHip'], ['rShoulder', 'rHip'],
  ['lHip', 'rHip'], ['lHip', 'lKnee'], ['lKnee', 'lAnkle'], ['rHip', 'rKnee'], ['rKnee', 'rAnkle'],
];

// ---- Tiny painter: each shape is a test "is this point inside?" ----
function createImage(size) {
  const pixels = new Float64Array(size * size * 3);
  for (let i = 0; i < size * size; i++) pixels.set(PAPER, i * 3);

  // Paint a shape with soft (anti-aliased) edges by testing 4x4 points inside each pixel.
  // A shape is [inside(x, y), [left, top, right, bottom]]; the box just saves time.
  function paint([inside, [x0, y0, x1, y1]], color) {
    const left = Math.max(0, Math.floor(x0)), right = Math.min(size, Math.ceil(x1));
    const top = Math.max(0, Math.floor(y0)), bottom = Math.min(size, Math.ceil(y1));
    for (let y = top; y < bottom; y++) {
      for (let x = left; x < right; x++) {
        let hits = 0;
        for (let sy = 0; sy < 4; sy++)
          for (let sx = 0; sx < 4; sx++) if (inside(x + (sx + 0.5) / 4, y + (sy + 0.5) / 4)) hits++;
        if (!hits) continue;
        const a = hits / 16, i = (y * size + x) * 3;
        for (let c = 0; c < 3; c++) pixels[i + c] += (color[c] - pixels[i + c]) * a;
      }
    }
  }
  return { pixels, paint };
}

const circle = (cx, cy, r) => [(x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r, [cx - r, cy - r, cx + r, cy + r]];
const ring = (cx, cy, r, w) => [
  (x, y) => { const d = Math.hypot(x - cx, y - cy); return d <= r + w / 2 && d >= r - w / 2; },
  [cx - r - w, cy - r - w, cx + r + w, cy + r + w],
];
// A thick line with round ends: points within `w/2` of the segment a–b.
function capsule([ax, ay], [bx, by], w) {
  const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
  return [
    (x, y) => {
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2));
      return Math.hypot(x - ax - t * dx, y - ay - t * dy) <= w / 2;
    },
    [Math.min(ax, bx) - w, Math.min(ay, by) - w, Math.max(ax, bx) + w, Math.max(ay, by) + w],
  ];
}
// Point-in-polygon (the torso).
function polygon(points) {
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  return [
    (x, y) => {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i], [xj, yj] = points[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    },
    [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
  ];
}

function drawIcon(size) {
  const { pixels, paint } = createImage(size);
  const k = size / 512; // everything below is laid out on a 512 x 512 grid

  // Halftone sun: dots on a grid, bigger near the middle, fading out toward the edge.
  const sunX = 256 * k, sunY = 236 * k, sunR = 215 * k, step = 22 * k;
  for (let y = sunY - sunR; y <= sunY + sunR; y += step) {
    for (let x = sunX - sunR; x <= sunX + sunR; x += step) {
      const d = Math.hypot(x - sunX, y - sunY) / sunR;
      if (d < 1) paint(circle(x, y, step * 0.42 * (1 - d * 0.85)), SOFT_RED);
    }
  }

  // Mascot: map the 200 x 260 pose box into the icon, centered.
  const scale = 1.6 * k, offX = 256 * k - 100 * scale, offY = 262 * k - 160 * scale;
  const p = (name) => [offX + POSE[name][0] * scale, offY + POSE[name][1] * scale];

  paint(polygon([p('lShoulder'), p('rShoulder'), p('rHip'), p('lHip')]), RED);
  for (const [a, b] of BONES) paint(capsule(p(a), p(b), 11 * scale), INK);
  for (const name of Object.keys(POSE)) {
    if (name === 'head') continue;
    paint(circle(...p(name), 8.5 * scale), PAPER);
    paint(circle(...p(name), 6.5 * scale), RED);
  }
  const [hx, hy] = p('head');
  paint(circle(hx, hy, 21 * scale), INK);
  paint(circle(hx, hy, 15 * scale), PAPER);
  paint(circle(hx - 6 * scale, hy - 2 * scale, 2.6 * scale), INK);
  paint(circle(hx + 6 * scale, hy - 2 * scale, 2.6 * scale), INK);
  // Smile: the bottom part of a small ring.
  const [smile, box] = ring(hx, hy - 1 * scale, 7 * scale, 2.6 * scale);
  paint([(x, y) => y > hy + 2.5 * scale && smile(x, y), box], INK);

  return encodePng(size, pixels);
}

// ---- Minimal PNG writer (an image file is a header + compressed pixel rows) ----
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
function encodePng(size, pixels) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0; // no filter on this row
    for (let x = 0; x < size * 3; x++) raw[y * (size * 3 + 1) + 1 + x] = Math.round(pixels[y * size * 3 + x]);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // 8 bits per channel
  header[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });
for (const [file, size] of [['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180]]) {
  writeFileSync(`public/icons/${file}`, drawIcon(size));
  console.log(`Wrote public/icons/${file}`);
}
