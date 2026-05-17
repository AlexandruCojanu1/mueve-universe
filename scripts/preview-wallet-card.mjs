import sharp from "sharp";
import QRCode from "qrcode";
import fs from "node:fs/promises";
import path from "node:path";

const W = 750;
const H = 1320;
const OUT = path.resolve("preview-wallet.png");

const STRIP = await fs.readFile("public/wallet/apple/strip@2x.png");
const LOGO_SRC = await fs.readFile("public/wallet/apple/logo@2x.png");
const LOGO = await sharp(LOGO_SRC).resize({ height: 56 }).toBuffer();
const LOGO_META = await sharp(LOGO).metadata();

const qrSvg = await QRCode.toString("https://www.mueve.ro/q/demo", {
  type: "svg",
  margin: 0,
  color: { dark: "#0b1f3a", light: "#ffffff" },
});
const QR = await sharp(Buffer.from(qrSvg)).resize(360, 360).png().toBuffer();

const cardX = 40;
const cardY = 80;
const cardW = W - 80;
const cardH = H - 160;
const stripY = cardY + 130;
const stripH = 288;
const qrY = stripY + stripH + 80;
const fieldsY = qrY + 400 + 60;

const card = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
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

  <rect width="${W}" height="${H}" fill="#0a0a0a"/>

  <g filter="url(#shadow)">
    <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="32" fill="url(#bg)"/>
  </g>

  <!-- header right: small consecvență -->
  <g transform="translate(${cardX + cardW - 50} ${cardY + 60})" text-anchor="end">
    <text font-family="Helvetica" font-size="13" font-weight="700" letter-spacing="2.5" fill="#ffe85c">CONSECVENȚĂ</text>
    <text y="32" font-family="Helvetica" font-size="28" font-weight="800" fill="#fff">20W</text>
  </g>

  <!-- QR backdrop centered mid-card -->
  <rect x="${(W - 440) / 2}" y="${qrY - 20}" width="440" height="440" rx="22" fill="#ffffff"/>

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

await sharp(Buffer.from(card))
  .composite([
    { input: STRIP, left: cardX, top: stripY },
    { input: LOGO, left: cardX + 35, top: cardY + 50 },
    { input: QR, left: Math.round((W - 360) / 2), top: qrY },
  ])
  .png()
  .toFile(OUT);

console.log("wrote", OUT);
