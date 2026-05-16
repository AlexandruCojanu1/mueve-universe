"use client";
import { useEffect, useRef } from "react";

export default function DaySky() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const bg = ref.current;
    if (!bg) return;
    const bx = bg.getContext("2d");
    if (!bx) return;

    type Puff = { dx: number; dy: number; r: number; shade: number };
    type Cloud = {
      x: number;
      y: number;
      w: number;
      h: number;
      sp: number;
      op: number;
      puffs: Puff[];
    };
    const clouds: Cloud[] = [];

    const sz = () => {
      bg.width = window.innerWidth;
      bg.height = window.innerHeight;
    };
    sz();
    window.addEventListener("resize", sz);

    // Cloud band: top 28% of viewport
    const cloudBandMax = () => Math.max(140, window.innerHeight * 0.28);

    const makeCloud = (): Cloud => {
      const w = 280 + Math.random() * 360;
      const h = 48 + Math.random() * 40;
      const c: Cloud = {
        x: Math.random() * window.innerWidth,
        y: 50 + Math.random() * cloudBandMax(),
        w,
        h,
        sp: 0.02 + Math.random() * 0.06,
        op: 0.72 + Math.random() * 0.2,
        puffs: [],
      };
      // Cumulus: flat-ish base, tall puffy tops. Build ~10–14 ellipses.
      const count = 10 + Math.floor(Math.random() * 5);
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        // Spread along width, with jitter
        const dx = t * w + (Math.random() - 0.5) * h * 0.5;
        // Tops bulge up (negative dy), base sits near 0
        const bulge = Math.sin(t * Math.PI) * h * 0.55;
        const dy = -bulge + (Math.random() - 0.3) * h * 0.35;
        const r = h * (0.55 + Math.random() * 0.55);
        // Shade: puffs higher up catch more sun (lighter), lower puffs in shadow
        const shade = 0.65 + (bulge / h) * 0.55 + Math.random() * 0.1;
        c.puffs.push({ dx, dy, r, shade: Math.min(1, shade) });
      }
      // Add 2–3 extra small puffs near base for detail
      const baseCount = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < baseCount; i++) {
        const t = 0.2 + Math.random() * 0.6;
        c.puffs.push({
          dx: t * w,
          dy: h * (0.15 + Math.random() * 0.15),
          r: h * (0.4 + Math.random() * 0.3),
          shade: 0.55 + Math.random() * 0.1,
        });
      }
      return c;
    };

    for (let i = 0; i < 7; i++) clouds.push(makeCloud());

    let raf = 0;
    const draw = () => {
      if (document.hidden) {
        raf = requestAnimationFrame(draw);
        return;
      }
      // Richer daytime sky — deeper top, mid blue, soft horizon
      const g = bx.createLinearGradient(0, 0, 0, bg.height);
      g.addColorStop(0, "#1F4E78");
      g.addColorStop(0.55, "#3D7BA6");
      g.addColorStop(1, "#7CA8C6");
      bx.fillStyle = g;
      bx.fillRect(0, 0, bg.width, bg.height);

      // Diffuse sun glow near top-right — softer than before
      const sunX = bg.width * 0.72;
      const sunY = bg.height * 0.14;
      const sun = bx.createRadialGradient(sunX, sunY, 0, sunX, sunY, bg.height * 0.6);
      sun.addColorStop(0, "rgba(255,235,190,0.18)");
      sun.addColorStop(0.4, "rgba(255,220,170,0.06)");
      sun.addColorStop(1, "rgba(255,220,170,0)");
      bx.fillStyle = sun;
      bx.fillRect(0, 0, bg.width, bg.height);

      // ── Clouds ───────────────────────────────
      // Pause cloud drift once user scrolls past hero, so background stays calm
      // and section text remains comfortable to read.
      const pastHero = window.scrollY > window.innerHeight * 0.6;
      for (const c of clouds) {
        if (!pastHero) c.x += c.sp;
        if (c.x - c.w * 1.1 > bg.width) c.x = -c.w;

        for (const p of c.puffs) {
          const cx = c.x + p.dx;
          const cy = c.y + p.dy;
          const grad = bx.createRadialGradient(
            cx - p.r * 0.3,
            cy - p.r * 0.4,
            p.r * 0.1,
            cx,
            cy,
            p.r * 1.15,
          );
          const top = Math.min(1, p.shade + 0.12);
          const mid = p.shade;
          const bot = Math.max(0.4, p.shade - 0.25);
          grad.addColorStop(0, `rgba(255,255,255,${c.op * top})`);
          grad.addColorStop(0.5, `rgba(245,248,252,${c.op * mid * 0.85})`);
          grad.addColorStop(1, "rgba(190,205,220,0)");
          bx.fillStyle = grad;
          bx.beginPath();
          bx.arc(cx, cy, p.r * 1.15, 0, 6.28);
          bx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", sz);
    };
  }, []);
  return <canvas id="bg" ref={ref} />;
}
