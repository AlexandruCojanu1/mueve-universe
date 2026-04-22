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
    type Gull = {
      x: number;
      y: number;
      sp: number;
      wing: number;
      wingSp: number;
      scale: number;
      dir: 1 | -1;
    };
    const clouds: Cloud[] = [];
    const gulls: Gull[] = [];

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
        sp: 0.04 + Math.random() * 0.14,
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

    for (let i = 0; i < 5; i++) {
      gulls.push({
        x: Math.random() * window.innerWidth,
        y: 100 + Math.random() * cloudBandMax() * 1.5,
        sp: 0.25 + Math.random() * 0.45,
        wing: Math.random() * 6.28,
        wingSp: 0.08 + Math.random() * 0.05,
        scale: 0.9 + Math.random() * 1.0,
        dir: Math.random() > 0.5 ? 1 : -1,
      });
    }

    let raf = 0;
    const draw = () => {
      // Slightly darker, more atmospheric daytime gradient
      const g = bx.createLinearGradient(0, 0, 0, bg.height);
      g.addColorStop(0, "#2E5E87");
      g.addColorStop(0.5, "#508AB0");
      g.addColorStop(1, "#8AB2CC");
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
      // Two-pass render: soft shadow base, then lit body on top.
      for (const c of clouds) {
        c.x += c.sp;
        if (c.x - c.w * 1.1 > bg.width) c.x = -c.w;

        // Pass 1: soft underbelly shadow
        bx.save();
        bx.filter = "blur(14px)";
        bx.fillStyle = `rgba(60,85,115,${c.op * 0.35})`;
        bx.beginPath();
        for (const p of c.puffs) {
          bx.moveTo(c.x + p.dx + p.r, c.y + p.dy + p.r * 0.35);
          bx.arc(c.x + p.dx, c.y + p.dy + p.r * 0.25, p.r * 0.95, 0, 6.28);
        }
        bx.fill();
        bx.restore();

        // Pass 2: lit body — per-puff shade gradient (top lighter, bottom warmer)
        bx.save();
        bx.filter = "blur(6px)";
        for (const p of c.puffs) {
          const cx = c.x + p.dx;
          const cy = c.y + p.dy;
          const grad = bx.createRadialGradient(
            cx - p.r * 0.3,
            cy - p.r * 0.4,
            p.r * 0.1,
            cx,
            cy,
            p.r,
          );
          const top = Math.min(1, p.shade + 0.12);
          const mid = p.shade;
          const bot = Math.max(0.4, p.shade - 0.25);
          grad.addColorStop(0, `rgba(255,255,255,${c.op * top})`);
          grad.addColorStop(0.55, `rgba(245,248,252,${c.op * mid})`);
          grad.addColorStop(1, `rgba(190,205,220,${c.op * bot * 0.5})`);
          bx.fillStyle = grad;
          bx.beginPath();
          bx.arc(cx, cy, p.r, 0, 6.28);
          bx.fill();
        }
        bx.restore();

        // Pass 3: sharp highlight on sun-facing top (subtle, no blur)
        bx.save();
        bx.globalCompositeOperation = "lighter";
        for (const p of c.puffs) {
          if (p.shade < 0.85) continue;
          const cx = c.x + p.dx;
          const cy = c.y + p.dy;
          const hl = bx.createRadialGradient(
            cx - p.r * 0.25,
            cy - p.r * 0.45,
            0,
            cx - p.r * 0.25,
            cy - p.r * 0.45,
            p.r * 0.7,
          );
          hl.addColorStop(0, `rgba(255,250,230,${c.op * 0.22})`);
          hl.addColorStop(1, "rgba(255,250,230,0)");
          bx.fillStyle = hl;
          bx.beginPath();
          bx.arc(cx, cy, p.r, 0, 6.28);
          bx.fill();
        }
        bx.restore();
      }

      // ── Gulls ────────────────────────────────
      for (const gl of gulls) {
        gl.x += gl.sp * gl.dir;
        gl.wing += gl.wingSp;
        if (gl.dir === 1 && gl.x > bg.width + 40) {
          gl.x = -40;
          gl.y = 100 + Math.random() * cloudBandMax() * 1.5;
        }
        if (gl.dir === -1 && gl.x < -40) {
          gl.x = bg.width + 40;
          gl.y = 100 + Math.random() * cloudBandMax() * 1.5;
        }

        // Flap phase: smooth ease in/out, slightly asymmetric for realism
        const f = Math.sin(gl.wing);
        const flapUp = Math.max(0, f);
        const flapDn = Math.max(0, -f);

        bx.save();
        bx.translate(gl.x, gl.y);
        bx.scale(gl.scale * gl.dir, gl.scale);

        // Body: tiny elongated ellipse
        bx.fillStyle = "rgba(30,40,60,0.85)";
        bx.beginPath();
        bx.ellipse(0, 0, 4.5, 1.6, 0, 0, 6.28);
        bx.fill();

        // Wings: two-segment each side (inner arm + outer hand)
        bx.strokeStyle = "rgba(25,35,55,0.9)";
        bx.lineWidth = 1.5;
        bx.lineCap = "round";
        bx.lineJoin = "round";

        // Left wing (from body going left-back)
        const innerRise = 3 + flapUp * 5;
        const outerRise = 6 + flapUp * 9 - flapDn * 4;
        const innerDip = flapDn * 3;

        bx.beginPath();
        // Inner arm: body → shoulder joint
        bx.moveTo(-3, 0);
        bx.quadraticCurveTo(-6, -innerRise, -9, -innerRise + innerDip);
        // Outer hand: joint → wingtip (curves up & back)
        bx.quadraticCurveTo(-13, -outerRise, -17, -outerRise * 0.5);
        bx.stroke();

        // Right wing (mirror)
        bx.beginPath();
        bx.moveTo(3, 0);
        bx.quadraticCurveTo(6, -innerRise, 9, -innerRise + innerDip);
        bx.quadraticCurveTo(13, -outerRise, 17, -outerRise * 0.5);
        bx.stroke();

        // Head dot (small darker accent in front of body)
        bx.fillStyle = "rgba(20,28,45,0.9)";
        bx.beginPath();
        bx.arc(4.5, -0.3, 1.1, 0, 6.28);
        bx.fill();

        bx.restore();
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
