import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 30000 });
await new Promise((r) => setTimeout(r, 2000));

const sections = await page.evaluate(() => {
  const find = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height };
  };
  return {
    hero: find(".hero"),
    prog: find(".prog"),
    worlds: find("#worlds"),
    mission: find(".mission"),
    join: find(".join"),
    foot: find(".foot"),
  };
});
console.log(JSON.stringify(sections, null, 2));

for (const [name, rect] of Object.entries(sections)) {
  if (!rect) continue;
  await page.screenshot({
    path: `/tmp/sec-${name}.png`,
    clip: { x: 0, y: rect.y, width: 1440, height: Math.min(rect.height + 20, 2800) },
  });
  console.log(`  /tmp/sec-${name}.png (${rect.height}px)`);
}
await browser.close();
