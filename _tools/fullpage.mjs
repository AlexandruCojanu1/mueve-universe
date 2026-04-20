import puppeteer from "puppeteer";

const url = process.argv[2] || "http://localhost:3000";
const out = process.argv[3] || "/tmp/mueve-full.png";

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log("saved", out);
