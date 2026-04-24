"use client";
import { useEffect, useRef } from "react";

const FRAMES = [
  "/birds/bird-1.png",
  "/birds/bird-2.png",
  "/birds/bird-3.png",
  "/birds/bird-6.png",
  "/birds/bird-5.png",
];
const FLAP_CYCLE = FRAMES.length;
const GLIDE_FRAME = 1;

type Flock = {
  x: number;
  y: number;
  heading: number;
  targetHeading: number;
  baseSpeed: number;
  altitude: number;
  members: Member[];
  nextHeadingChangeAt: number;
  facing: 1 | -1;
};

type Member = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  tilt: number;
  dx: number;
  dy: number;
  lag: number;
  scale: number;
  frame: number;
  frameT: number;
  frameDur: number;
  isGliding: boolean;
  glideUntil: number;
  nextGlideAt: number;
  bobPhase: number;
  bobAmp: number;
};

export default function Birds() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const sz = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    sz();
    window.addEventListener("resize", sz);

    const imgs: HTMLImageElement[] = FRAMES.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const altBand = () => ({
      top: 60,
      bot: Math.max(260, H() * 0.42),
    });

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const makeFlock = (offscreen: boolean, now: number): Flock => {
      const goingRight = Math.random() > 0.5;
      const band = altBand();
      const altitude = rand(band.top, band.bot);
      const baseSpeed = rand(0.7, 1.1);
      // Heading is signed: near 0 for right, near 0 inside a "facing-left" frame too.
      // We keep heading in a small range (±0.3) and use `facing` for mirror.
      const heading = rand(-0.1, 0.1);
      const facing: 1 | -1 = goingRight ? 1 : -1;

      const startX = offscreen
        ? goingRight
          ? -240
          : W() + 240
        : rand(W() * 0.2, W() * 0.8);

      const n = 3 + Math.floor(Math.random() * 4);

      const members: Member[] = [];
      for (let i = 0; i < n; i++) {
        const row = i === 0 ? 0 : 1 + Math.floor((i - 1) / 2);
        const side = i === 0 ? 0 : (i - 1) % 2 === 0 ? -1 : 1;
        const dxBack = row * rand(28, 40);
        const dxLat = side * row * rand(18, 28);
        const dyLat = side * row * rand(6, 12) + rand(-4, 4);
        const scale = rand(0.04, 0.07) * (i === 0 ? 1.1 : 1);
        const mx = startX - facing * dxBack;
        const my = altitude + dyLat;
        members.push({
          x: mx,
          y: my,
          prevX: mx,
          prevY: my,
          vx: facing * baseSpeed,
          vy: 0,
          facing,
          tilt: 0,
          dx: dxBack,
          dy: dxLat,
          lag: 0.05 + Math.random() * 0.04,
          scale,
          frame: Math.floor(Math.random() * FLAP_CYCLE),
          frameT: Math.random() * 300,
          frameDur: rand(130, 180),
          isGliding: false,
          glideUntil: 0,
          nextGlideAt: now + rand(2500, 6000),
          bobPhase: Math.random() * Math.PI * 2,
          bobAmp: rand(2, 5),
        });
      }

      return {
        x: startX,
        y: altitude,
        heading,
        targetHeading: heading,
        baseSpeed,
        altitude,
        members,
        nextHeadingChangeAt: now + rand(3500, 7000),
        facing,
      };
    };

    const flocks: Flock[] = [
      makeFlock(false, performance.now()),
      makeFlock(false, performance.now() + 1000),
    ];

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      if (document.hidden) {
        last = now;
        raf = requestAnimationFrame(tick);
        return;
      }
      const dtMs = Math.min(48, now - last);
      last = now;
      const dt = dtMs / 16;

      ctx.clearRect(0, 0, W(), H());

      for (let fi = flocks.length - 1; fi >= 0; fi--) {
        const f = flocks[fi];

        // Gentle heading drift (small angle, always within "facing" side)
        if (now > f.nextHeadingChangeAt) {
          f.targetHeading = rand(-0.22, 0.22);
          f.nextHeadingChangeAt = now + rand(4500, 9000);
        }
        f.heading += (f.targetHeading - f.heading) * 0.012 * dt;

        // Velocity derived from facing + small heading offset — never flips sign
        const fvx = f.facing * f.baseSpeed * Math.cos(f.heading);
        const fvy =
          f.baseSpeed * Math.sin(f.heading) +
          Math.sin(now * 0.00035 + f.altitude * 0.01) * 0.18;

        f.x += fvx * dt;
        f.y += fvy * dt;

        // Keep altitude within soft band
        const band = altBand();
        if (f.y < band.top) f.y += (band.top - f.y) * 0.02 * dt;
        if (f.y > band.bot) f.y -= (f.y - band.bot) * 0.02 * dt;

        // Offscreen recycle
        if (
          (f.facing === 1 && f.x > W() + 280) ||
          (f.facing === -1 && f.x < -280)
        ) {
          flocks[fi] = makeFlock(true, now);
          continue;
        }

        // Formation anchors: local frame is aligned with facing, never mirrored by heading
        // Offset "back" means behind the bird in its travel direction
        for (const m of f.members) {
          const backX = -f.facing * m.dx;
          const latX = 0;
          const latY = m.dy;
          const tx = f.x + backX + latX;
          const ty = f.y + latY;

          m.prevX = m.x;
          m.prevY = m.y;
          m.x += (tx - m.x) * m.lag * dt;
          m.y += (ty - m.y) * m.lag * dt;

          // Member velocity this frame
          const rawVx = (m.x - m.prevX) / Math.max(0.016, dtMs / 1000);
          const rawVy = (m.y - m.prevY) / Math.max(0.016, dtMs / 1000);
          m.vx += (rawVx - m.vx) * 0.15;
          m.vy += (rawVy - m.vy) * 0.15;

          // Facing hysteresis — only flip if strongly moving opposite direction
          if (m.facing === 1 && m.vx < -12) m.facing = -1;
          else if (m.facing === -1 && m.vx > 12) m.facing = 1;

          // Tilt = bank angle ≈ vertical velocity component / horizontal
          const targetTilt = Math.atan2(m.vy, Math.abs(m.vx) + 0.01) * 0.45;
          const clampedTilt = Math.max(-0.35, Math.min(0.35, targetTilt));
          m.tilt += (clampedTilt - m.tilt) * 0.08 * dt;

          m.bobPhase += 0.0025 * dtMs;

          // Glide cycle
          if (!m.isGliding && now > m.nextGlideAt) {
            m.isGliding = true;
            m.frame = GLIDE_FRAME;
            m.glideUntil = now + rand(800, 1700);
          }
          if (m.isGliding && now > m.glideUntil) {
            m.isGliding = false;
            m.frameT = 0;
            m.nextGlideAt = now + rand(3500, 8000);
          }
          if (!m.isGliding) {
            m.frameT += dtMs;
            if (m.frameT >= m.frameDur) {
              m.frameT = 0;
              m.frame = (m.frame + 1) % FLAP_CYCLE;
            }
          }
        }
      }

      // Depth sort — larger (closer) on top
      const all: Member[] = [];
      for (const f of flocks) for (const m of f.members) all.push(m);
      all.sort((a, b) => a.scale - b.scale);

      for (const m of all) {
        const img = imgs[m.frame];
        if (!img.complete || img.naturalWidth === 0) continue;
        const bob = Math.sin(m.bobPhase) * m.bobAmp;
        const w = img.naturalWidth * m.scale;
        const h = img.naturalHeight * m.scale;
        // Sprites are normalized LEFT-facing. Mirror only when bird flies right.
        // Tilt is signed in world space; mirroring flips its visual sign correctly
        // because we apply scale BEFORE rotate.
        ctx.save();
        ctx.translate(m.x, m.y + bob);
        if (m.facing === 1) ctx.scale(-1, 1);
        ctx.rotate(m.facing * m.tilt);
        ctx.globalAlpha = 0.93;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", sz);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}
