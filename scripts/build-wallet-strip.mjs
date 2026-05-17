import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";

const BG = { r: 58, g: 110, b: 165, alpha: 1 }; // #3A6EA5
const OUT_DIR = path.resolve("public/wallet/apple");
const BIRDS_DIR = path.resolve("public/birds");

// Apple strip image sizes for a generic pass (full-bleed under fields)
const SIZES = [
  { name: "strip.png", w: 375, h: 144 },
  { name: "strip@2x.png", w: 750, h: 288 },
  { name: "strip@3x.png", w: 1125, h: 432 },
];

// Bird layout: x% from left, y% from top, scale relative to strip height,
// pick which bird PNG, and opacity. Five birds spread across like a flock.
const FLOCK = [
  { file: "bird-1.png", xPct: 0.10, yPct: 0.30, scale: 0.55, alpha: 0.95 },
  { file: "bird-3.png", xPct: 0.28, yPct: 0.55, scale: 0.40, alpha: 0.80 },
  { file: "bird-2.png", xPct: 0.46, yPct: 0.20, scale: 0.70, alpha: 1.0 },
  { file: "bird-5.png", xPct: 0.66, yPct: 0.45, scale: 0.45, alpha: 0.85 },
  { file: "bird-4.png", xPct: 0.84, yPct: 0.28, scale: 0.55, alpha: 0.9 },
];

async function buildStrip({ w, h, name }) {
  // Base: solid ocean-blue with a soft top→bottom highlight to suggest sky.
  const gradientSvg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#5a8fc7"/>
        <stop offset="55%" stop-color="#3a6ea5"/>
        <stop offset="100%" stop-color="#2c5784"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
  </svg>`;

  const base = sharp(Buffer.from(gradientSvg)).png();

  const composites = [];
  for (const bird of FLOCK) {
    const src = path.join(BIRDS_DIR, bird.file);
    const targetH = Math.round(h * bird.scale);
    const resized = await sharp(src)
      .resize({ height: targetH, withoutEnlargement: false })
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    // Multiply alpha channel by bird.alpha to fade into the background.
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
console.log("done. background:", `rgb(${BG.r},${BG.g},${BG.b})`);
