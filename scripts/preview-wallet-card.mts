import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { buildStripWithQr } from "../src/lib/wallet/strip-renderer";

const W = 750;
const H = 1320;
const OUT = path.resolve("preview-wallet.png");

const strips = await buildStripWithQr("https://www.mueve.ro/q/demo");
const STRIP = strips["strip@2x.png"]; // 750×864 — the baked-QR strip
const STRIP_META = await sharp(STRIP).metadata();

const LOGO_SRC = await fs.readFile("public/wallet/apple/logo@2x.png");
const LOGO = await sharp(LOGO_SRC).resize({ height: 56 }).toBuffer();

const cardX = 40;
const cardY = 80;
const cardW = W - 80;
const stripY = cardY + 130;
const stripH = Math.round((STRIP_META.height ?? 864) * (cardW / (STRIP_META.width ?? 750)));
const fieldsY = stripY + stripH + 40;
const cardH = fieldsY + 160 - cardY;

const card = `<svg width="${W}" height="${cardY + cardH + 40}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a6ea5"/>
      <stop offset="100%" stop-color="#2c5784"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="14"/>
      <feOffset dx="0" dy="8"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.35"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="${W}" height="${cardY + cardH + 40}" fill="#0a0a0a"/>

  <g filter="url(#shadow)">
    <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="32" fill="url(#bg)"/>
  </g>

  <!-- header right: small CONSECVENȚĂ -->
  <g transform="translate(${cardX + cardW - 50} ${cardY + 60})" text-anchor="end">
    <text font-family="Helvetica" font-size="13" font-weight="700" letter-spacing="2.5" fill="#ffe85c">CONSECVENȚĂ</text>
    <text y="32" font-family="Helvetica" font-size="28" font-weight="800" fill="#fff">20W</text>
  </g>

  <!-- bottom fields row -->
  <g transform="translate(${cardX + 40} ${fieldsY})">
    <g>
      <text font-family="Helvetica" font-size="12" font-weight="700" letter-spacing="2.5" fill="#ffe85c">MEMBER</text>
      <text y="28" font-family="Helvetica" font-size="20" font-weight="600" fill="#fff">Alexandru Cojanu</text>
    </g>
    <g transform="translate(${(cardW - 80) * 0.50} 0)">
      <text font-family="Helvetica" font-size="12" font-weight="700" letter-spacing="2.5" fill="#ffe85c">TIER</text>
      <text y="28" font-family="Helvetica" font-size="20" font-weight="600" fill="#fff">Legend</text>
    </g>
  </g>
  <g transform="translate(${cardX + 40} ${fieldsY + 70})">
    <g>
      <text font-family="Helvetica" font-size="12" font-weight="700" letter-spacing="2.5" fill="#ffe85c">XP</text>
      <text y="28" font-family="Helvetica" font-size="20" font-weight="600" fill="#fff">8680</text>
    </g>
    <g transform="translate(${(cardW - 80) * 0.50} 0)">
      <text font-family="Helvetica" font-size="12" font-weight="700" letter-spacing="2.5" fill="#ffe85c">EST.</text>
      <text y="28" font-family="Helvetica" font-size="20" font-weight="600" fill="#fff">MAI 2026</text>
    </g>
  </g>
</svg>`;

// Resize the strip to card width
const stripResized = await sharp(STRIP).resize({ width: cardW }).png().toBuffer();

await sharp(Buffer.from(card))
  .composite([
    { input: stripResized, left: cardX, top: stripY },
    { input: LOGO, left: cardX + 35, top: cardY + 50 },
  ])
  .png()
  .toFile(OUT);

console.log("wrote", OUT);
