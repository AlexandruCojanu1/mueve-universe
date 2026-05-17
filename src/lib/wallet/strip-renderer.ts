import sharp from "sharp";
import path from "node:path";

const BIRDS_DIR = path.resolve(process.cwd(), "public/birds");

const FLOCK = [
  { file: "bird-1.png", xPct: 0.20, yPct: 0.74, scale: 0.32, alpha: 0.85 },
  { file: "bird-3.png", xPct: 0.32, yPct: 0.62, scale: 0.40, alpha: 0.95 },
  { file: "bird-2.png", xPct: 0.50, yPct: 0.50, scale: 0.46, alpha: 1.0 },
  { file: "bird-5.png", xPct: 0.66, yPct: 0.42, scale: 0.40, alpha: 0.95 },
  { file: "bird-4.png", xPct: 0.82, yPct: 0.34, scale: 0.36, alpha: 0.9 },
] as const;

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function skySvg(w: number, h: number, name: string): string {
  const nameSize = Math.round(h * 0.16);
  const namePad = Math.round(h * 0.10);
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f4d8a8"/>
        <stop offset="22%" stop-color="#e8b389"/>
        <stop offset="50%" stop-color="#7ba0c8"/>
        <stop offset="80%" stop-color="#3a6ea5"/>
        <stop offset="100%" stop-color="#234c79"/>
      </linearGradient>
      <radialGradient id="sun" cx="0.82" cy="0.30" r="0.30">
        <stop offset="0%" stop-color="#fff3d6" stop-opacity="0.95"/>
        <stop offset="40%" stop-color="#ffd99a" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="#ffd99a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#sky)"/>
    <rect width="${w}" height="${h}" fill="url(#sun)"/>
    <path d="M 0 ${h * 0.84}
             C ${w * 0.25} ${h * 0.81}, ${w * 0.55} ${h * 0.88}, ${w} ${h * 0.84}
             L ${w} ${h} L 0 ${h} Z"
          fill="#1a3a5e" opacity="0.65"/>
    <text x="${namePad}" y="${namePad + nameSize}"
          font-family="Helvetica, Arial, sans-serif"
          font-size="${nameSize}"
          font-weight="700"
          fill="#ffffff"
          style="paint-order: stroke; stroke: rgba(15,31,64,0.35); stroke-width: ${Math.max(1, nameSize / 28)}px;">${escapeXml(name)}</text>
  </svg>`;
}

async function renderBird(file: string, targetH: number, alpha: number) {
  const buf = await sharp(path.join(BIRDS_DIR, file))
    .resize({ height: targetH, withoutEnlargement: false })
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });
  const { data: raw, info } = await sharp(buf.data)
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 3; i < raw.length; i += 4) raw[i] = Math.round(raw[i] * alpha);
  return sharp(raw, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
}

async function renderAt(w: number, h: number, name: string) {
  const sky = await sharp(Buffer.from(skySvg(w, h, name))).png().toBuffer();
  const composites: sharp.OverlayOptions[] = [];
  for (const bird of FLOCK) {
    const targetH = Math.round(h * bird.scale);
    const b = await renderBird(bird.file, targetH, bird.alpha);
    composites.push({
      input: b.data,
      left: Math.round(w * bird.xPct - b.info.width / 2),
      top: Math.round(h * bird.yPct - b.info.height / 2),
    });
  }
  return sharp(sky).composite(composites).png().toBuffer();
}

/**
 * Strip with user's name overlaid top-left, on a dawn sky with the gull flock.
 * Renders the 1x/2x/3x sizes that pass directly into PKPass assets.
 */
export async function buildNamedStrip(name: string): Promise<{
  "strip.png": Buffer;
  "strip@2x.png": Buffer;
  "strip@3x.png": Buffer;
}> {
  return {
    "strip.png": await renderAt(375, 144, name),
    "strip@2x.png": await renderAt(750, 288, name),
    "strip@3x.png": await renderAt(1125, 432, name),
  };
}
