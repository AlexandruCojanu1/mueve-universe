import sharp from "sharp";
import QRCode from "qrcode";
import path from "node:path";
import fs from "node:fs/promises";

// Cartoon gull flock from public/birds/, sized + positioned for a 1x strip.
// Positions are percentages so they scale to @2x/@3x cleanly.
const FLOCK = [
  { file: "bird-1.png", xPct: 0.06, yPct: 0.78, scale: 0.34, alpha: 0.85 },
  { file: "bird-3.png", xPct: 0.16, yPct: 0.68, scale: 0.42, alpha: 0.95 },
  { file: "bird-2.png", xPct: 0.84, yPct: 0.55, scale: 0.45, alpha: 1.0 },
  { file: "bird-5.png", xPct: 0.93, yPct: 0.42, scale: 0.32, alpha: 0.9 },
] as const;

function buildSkySvg(w: number, h: number, qrSlotPx: number): string {
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f4d8a8"/>
        <stop offset="22%" stop-color="#e8b389"/>
        <stop offset="50%" stop-color="#7ba0c8"/>
        <stop offset="80%" stop-color="#3a6ea5"/>
        <stop offset="100%" stop-color="#234c79"/>
      </linearGradient>
      <radialGradient id="sun" cx="0.18" cy="0.30" r="0.30">
        <stop offset="0%" stop-color="#fff3d6" stop-opacity="0.95"/>
        <stop offset="40%" stop-color="#ffd99a" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="#ffd99a" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#sky)"/>
    <rect width="${w}" height="${h}" fill="url(#sun)"/>
    <path d="M 0 ${h * 0.86}
             C ${w * 0.25} ${h * 0.83}, ${w * 0.55} ${h * 0.90}, ${w} ${h * 0.86}
             L ${w} ${h} L 0 ${h} Z"
          fill="#1a3a5e" opacity="0.65"/>
  </svg>`;
}

const BIRDS_DIR = path.resolve(process.cwd(), "public/birds");

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

async function renderAt(w: number, h: number, qrPayload: string) {
  // QR tile sits centered with white background, dark navy modules.
  const qrSizePx = Math.round(Math.min(h * 0.78, w * 0.58));
  const qrPng = await QRCode.toBuffer(qrPayload, {
    type: "png",
    margin: 1,
    width: qrSizePx,
    color: { dark: "#0b1f3a", light: "#ffffff" },
  });

  // White rounded tile behind the QR for contrast against the sky.
  const tilePad = Math.round(h * 0.06);
  const tileSize = qrSizePx + tilePad * 2;
  const tile = await sharp({
    create: {
      width: tileSize,
      height: tileSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${tileSize}" height="${tileSize}"><rect width="${tileSize}" height="${tileSize}" rx="${tilePad}" fill="white"/></svg>`,
        ),
        blend: "dest-in",
      },
      { input: qrPng, left: tilePad, top: tilePad },
    ])
    .png()
    .toBuffer();

  const sky = await sharp(Buffer.from(buildSkySvg(w, h, qrSizePx))).png().toBuffer();

  const composites: sharp.OverlayOptions[] = [];

  // Birds first (behind tile so QR sits on top)
  for (const bird of FLOCK) {
    const targetH = Math.round(h * bird.scale);
    const b = await renderBird(bird.file, targetH, bird.alpha);
    composites.push({
      input: b.data,
      left: Math.round(w * bird.xPct - b.info.width / 2),
      top: Math.round(h * bird.yPct - b.info.height / 2),
    });
  }

  // QR tile centered
  composites.push({
    input: tile,
    left: Math.round((w - tileSize) / 2),
    top: Math.round((h - tileSize) / 2),
  });

  return sharp(sky).composite(composites).png().toBuffer();
}

/**
 * Returns the 1x/2x/3x strip PNGs with the QR baked in the middle, on a
 * dawn-sky background with the cartoon gull flock around it.
 *
 * Caller should pass these directly into PKPass constructor's assets dict
 * (in addition to icon.png and logo.png) and OMIT `setBarcodes` so the
 * baked QR is the only one shown.
 */
export async function buildStripWithQr(qrPayload: string): Promise<{
  "strip.png": Buffer;
  "strip@2x.png": Buffer;
  "strip@3x.png": Buffer;
}> {
  // 1x ~ 375x432 — taller than the default 144 strip; Apple still accepts
  // strip images of this aspect, just renders them at native height.
  const s1 = await renderAt(375, 432, qrPayload);
  const s2 = await renderAt(750, 864, qrPayload);
  const s3 = await renderAt(1125, 1296, qrPayload);
  return { "strip.png": s1, "strip@2x.png": s2, "strip@3x.png": s3 };
}

// Eager load icon/logo from public/wallet/apple/ for the caller to merge.
export async function loadStaticPassAssets(dir: string): Promise<Record<string, Buffer>> {
  const names = ["icon.png", "icon@2x.png", "icon@3x.png", "logo.png", "logo@2x.png", "logo@3x.png"];
  const out: Record<string, Buffer> = {};
  for (const n of names) {
    try {
      out[n] = await fs.readFile(path.join(dir, n));
    } catch {
      /* optional */
    }
  }
  return out;
}
