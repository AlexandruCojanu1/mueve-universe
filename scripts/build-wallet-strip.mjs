import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";

const OUT_DIR = path.resolve("public/wallet/apple");
const BIRDS_DIR = path.resolve("public/birds");

const SIZES = [
  { name: "strip.png", w: 375, h: 144 },
  { name: "strip@2x.png", w: 750, h: 288 },
  { name: "strip@3x.png", w: 1125, h: 432 },
];

// Flock of the actual cartoon gulls from public/birds. Loose V-formation
// drifting upward-right — symbolizes consecvență.
const FLOCK = [
  { file: "bird-1.png", xPct: 0.16, yPct: 0.68, scale: 0.40, alpha: 0.85 },
  { file: "bird-3.png", xPct: 0.30, yPct: 0.55, scale: 0.48, alpha: 0.95 },
  { file: "bird-2.png", xPct: 0.46, yPct: 0.46, scale: 0.55, alpha: 1.0 },
  { file: "bird-5.png", xPct: 0.62, yPct: 0.40, scale: 0.50, alpha: 0.95 },
  { file: "bird-4.png", xPct: 0.78, yPct: 0.32, scale: 0.45, alpha: 0.9 },
  { file: "bird-6.png", xPct: 0.90, yPct: 0.26, scale: 0.34, alpha: 0.8 },
];

function buildSkySvg(w, h) {
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f4d8a8"/>
        <stop offset="22%" stop-color="#e8b389"/>
        <stop offset="48%" stop-color="#7ba0c8"/>
        <stop offset="78%" stop-color="#3a6ea5"/>
        <stop offset="100%" stop-color="#1f3e6b"/>
      </linearGradient>
      <radialGradient id="sun" cx="0.82" cy="0.32" r="0.28">
        <stop offset="0%" stop-color="#fff3d6" stop-opacity="0.95"/>
        <stop offset="40%" stop-color="#ffd99a" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="#ffd99a" stop-opacity="0"/>
      </radialGradient>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/>
        <feColorMatrix values="0 0 0 0 1
                               0 0 0 0 1
                               0 0 0 0 1
                               0 0 0 0.05 0"/>
      </filter>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#sky)"/>
    <rect width="${w}" height="${h}" fill="url(#sun)"/>
    <line x1="0" y1="${h * 0.7}" x2="${w}" y2="${h * 0.7}" stroke="#ffffff" stroke-opacity="0.16" stroke-width="${Math.max(1, w / 750)}"/>
    <path d="M 0 ${h * 0.78}
             C ${w * 0.2} ${h * 0.75}, ${w * 0.5} ${h * 0.82}, ${w} ${h * 0.78}
             L ${w} ${h} L 0 ${h} Z"
          fill="#2c5784" opacity="0.55"/>
    <path d="M 0 ${h * 0.88}
             C ${w * 0.25} ${h * 0.86}, ${w * 0.55} ${h * 0.92}, ${w} ${h * 0.88}
             L ${w} ${h} L 0 ${h} Z"
          fill="#1a3a5e" opacity="0.85"/>
    <rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.5"/>
  </svg>`;
}

async function buildStrip({ w, h, name }) {
  const sky = await sharp(Buffer.from(buildSkySvg(w, h))).png().toBuffer();
  const base = sharp(sky);

  const composites = [];
  for (const bird of FLOCK) {
    const targetH = Math.round(h * bird.scale);
    const resized = await sharp(path.join(BIRDS_DIR, bird.file))
      .resize({ height: targetH, withoutEnlargement: false })
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    // Multiply alpha to control opacity
    const { data: raw, info } = await sharp(resized.data)
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let i = 3; i < raw.length; i += 4) {
      raw[i] = Math.round(raw[i] * bird.alpha);
    }
    const buf = await sharp(raw, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png()
      .toBuffer({ resolveWithObject: true });

    const left = Math.round(w * bird.xPct - buf.info.width / 2);
    const top = Math.round(h * bird.yPct - buf.info.height / 2);
    composites.push({ input: buf.data, left, top });
  }

  const out = await base.composite(composites).png().toBuffer();
  await fs.writeFile(path.join(OUT_DIR, name), out);
  console.log("wrote", name, w + "x" + h, out.length, "bytes");
}

await fs.mkdir(OUT_DIR, { recursive: true });
for (const s of SIZES) await buildStrip(s);
console.log("done.");
