import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";

const OUT_DIR = path.resolve("public/wallet/apple");

// Apple strip image sizes for a storeCard pass.
const SIZES = [
  { name: "strip.png", w: 375, h: 144 },
  { name: "strip@2x.png", w: 750, h: 288 },
  { name: "strip@3x.png", w: 1125, h: 432 },
];

// Vector bird silhouette — gull in mid-flap. Parametric so we can vary wing angle.
function gull(x, y, scale, angle, opacity) {
  const s = scale;
  // Two-curve gull silhouette; control points produce a classic seagull arc.
  const path = `M ${-22 * s} 0
                C ${-16 * s} ${-8 * s}, ${-10 * s} ${-12 * s}, 0 0
                C ${10 * s} ${-12 * s}, ${16 * s} ${-8 * s}, ${22 * s} 0`;
  return `<g transform="translate(${x} ${y}) rotate(${angle})">
    <path d="${path}" stroke="#ffffff" stroke-width="${1.6 * s}" stroke-linecap="round" fill="none" opacity="${opacity}"/>
  </g>`;
}

function buildSvg(w, h) {
  // Birds in loose V-formation, drifting upward-right — symbolizes consecvență.
  const flock = [
    [0.78, 0.30, 1.6, -8, 0.95],
    [0.68, 0.38, 1.4, -6, 0.85],
    [0.58, 0.46, 1.7, -4, 1.0],
    [0.48, 0.54, 1.3, -2, 0.78],
    [0.38, 0.62, 1.5, 0, 0.88],
    [0.27, 0.55, 1.1, 4, 0.7],
    [0.18, 0.68, 1.2, 6, 0.62],
  ]
    .map(([xp, yp, sc, ang, op]) => gull(xp * w, yp * h, sc * (w / 375), ang, op))
    .join("\n");

  // Wave silhouettes near the bottom — subtle, layered for parallax depth.
  const waveH = h * 0.18;
  const waveY = h - waveH;
  const wave = (yOff, opacity, fill) => `
    <path d="M 0 ${waveY + yOff}
             C ${w * 0.15} ${waveY + yOff - 6}, ${w * 0.35} ${waveY + yOff + 8}, ${w * 0.5} ${waveY + yOff}
             S ${w * 0.85} ${waveY + yOff - 6}, ${w} ${waveY + yOff}
             L ${w} ${h} L 0 ${h} Z"
          fill="${fill}" opacity="${opacity}"/>`;

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
      <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.0"/>
        <stop offset="55%" stop-color="#ffffff" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/>
        <feColorMatrix values="0 0 0 0 1
                               0 0 0 0 1
                               0 0 0 0 1
                               0 0 0 0.06 0"/>
      </filter>
    </defs>

    <!-- sky -->
    <rect width="${w}" height="${h}" fill="url(#sky)"/>
    <!-- soft sun -->
    <rect width="${w}" height="${h}" fill="url(#sun)"/>
    <!-- horizon haze -->
    <rect width="${w}" height="${h}" fill="url(#haze)"/>
    <!-- horizon hairline -->
    <line x1="0" y1="${h * 0.66}" x2="${w}" y2="${h * 0.66}" stroke="#ffffff" stroke-opacity="0.18" stroke-width="${Math.max(1, w / 750)}"/>
    <!-- waves stack -->
    ${wave(8, 0.35, "#2c5784")}
    ${wave(0, 0.55, "#234c79")}
    ${wave(-6, 0.85, "#1a3a5e")}
    <!-- gull flock -->
    ${flock}
    <!-- grain overlay for premium texture -->
    <rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.6"/>
  </svg>`;
}

async function buildStrip({ w, h, name }) {
  const svg = buildSvg(w, h);
  const out = await sharp(Buffer.from(svg)).png().toBuffer();
  await fs.writeFile(path.join(OUT_DIR, name), out);
  console.log("wrote", name, w + "x" + h, out.length, "bytes");
}

await fs.mkdir(OUT_DIR, { recursive: true });
for (const s of SIZES) await buildStrip(s);
console.log("done.");
