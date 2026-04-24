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
  vx: number;
  vy: number;
  heading: number;
  targetHeading: number;
  baseSpeed: number;
  altitude: number;
  members: Member[];
  nextHeadingChangeAt: number;
};

type Member = {
  x: number;
  y: number;
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
      mid: Math.max(200, H() * 0.3),
      bot: Math.max(260, H() * 0.42),
    });

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    // ── Flock construction ─────────────────────────────────────────
    const makeFlock = (offscreen: boolean, now: number): Flock => {
      const goingRight = Math.random() > 0.5;
      const band = altBand();
      const altitude = rand(band.top, band.bot);
      const baseSpeed = rand(0.65, 1.05);
      const heading = goingRight ? 0 : Math.PI;

      const startX = offscreen
        ? goingRight
          ? -220
          : W() + 220
        : rand(W() * 0.2, W() * 0.8);

      // Flock size — small flocks feel more natural
      const n = 3 + Math.floor(Math.random() * 4);

      // V-formation offsets: leader at front, others trail behind with lateral spread
      const members: Member[] = [];
      for (let i = 0; i < n; i++) {
        // Leader (i=0) at (0,0); others behind & sideways
        const row = i === 0 ? 0 : 1 + Math.floor((i - 1) / 2);
        const side = i === 0 ? 0 : ((i - 1) % 2 === 0 ? -1 : 1);
        // Backward offset (opposite to heading) + lateral
        const dxBack = row * rand(28, 40);
        const dxLat = side * row * rand(18, 28);
        const dyLat = side * row * rand(6, 12) + rand(-4, 4);
        const scale = rand(0.04, 0.07) * (i === 0 ? 1.1 : 1);
        members.push({
          x: startX - dxBack * Math.cos(heading) - dxLat * Math.sin(heading),
          y: altitude + dyLat,
          dx: dxBack,
          dy: dxLat,
          lag: 0.045 + Math.random() * 0.04,
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
        vx: baseSpeed * Math.cos(heading),
        vy: 0,
        heading,
        targetHeading: heading,
        baseSpeed,
        altitude,
        members,
        nextHeadingChangeAt: now + rand(3000, 7000),
      };
    };

    const flocks: Flock[] = [
      makeFlock(false, performance.now()),
      makeFlock(false, performance.now() + 1000),
    ];

    let raf = 0;
    let last = performance.now();

    // ── Main loop ─────────────────────────────────────────────────
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

        // Occasional gentle heading change (lazy curves)
        if (now > f.nextHeadingChangeAt) {
          const goingRight = Math.cos(f.heading) > 0;
          const baseDir = goingRight ? 0 : Math.PI;
          f.targetHeading = baseDir + rand(-0.18, 0.18);
          f.nextHeadingChangeAt = now + rand(4000, 9000);
        }
        // Smoothly steer heading toward target
        const dh = ((f.targetHeading - f.heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        f.heading += dh * 0.012 * dt;

        // Slow vertical thermal drift
        const drift = Math.sin(now * 0.0004 + f.altitude) * 0.025;
        f.vy += (drift - f.vy) * 0.02 * dt;
        f.vx = f.baseSpeed * Math.cos(f.heading);
        f.vy += 0; // placeholder; keep structure

        f.x += f.vx * dt;
        f.y += (f.vy + Math.sin(now * 0.0003 + f.altitude * 0.01) * 0.12) * dt;

        // Keep altitude within soft band
        const band = altBand();
        if (f.y < band.top) f.y += (band.top - f.y) * 0.02 * dt;
        if (f.y > band.bot) f.y -= (f.y - band.bot) * 0.02 * dt;

        // Offscreen recycle
        const goingRight = Math.cos(f.heading) > 0;
        if (
          (goingRight && f.x > W() + 260) ||
          (!goingRight && f.x < -260)
        ) {
          flocks[fi] = makeFlock(true, now);
          continue;
        }

        // Update each member with lag-follow + bobbing
        const hx = Math.cos(f.heading);
        const hy = Math.sin(f.heading);
        const px = -hy; // perpendicular
        const py = hx;

        for (const m of f.members) {
          const tx = f.x - m.dx * hx + m.dy * px;
          const ty = f.y - m.dx * hy + m.dy * py;
          m.x += (tx - m.x) * m.lag * dt;
          m.y += (ty - m.y) * m.lag * dt;
          m.bobPhase += 0.0025 * dtMs;

          // Glide logic: occasionally hold wings mid-spread
          if (!m.isGliding && now > m.nextGlideAt) {
            m.isGliding = true;
            m.frame = GLIDE_FRAME;
            m.glideUntil = now + rand(700, 1600);
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

      // ── Render (draw farther/back birds first via scale sort) ───
      const allMembers: Array<{ m: Member; heading: number }> = [];
      for (const f of flocks) {
        for (const m of f.members) allMembers.push({ m, heading: f.heading });
      }
      allMembers.sort((a, b) => a.m.scale - b.m.scale);

      for (const { m, heading } of allMembers) {
        const img = imgs[m.frame];
        if (!img.complete || img.naturalWidth === 0) continue;
        const bob = Math.sin(m.bobPhase) * m.bobAmp;
        const w = img.naturalWidth * m.scale;
        const h = img.naturalHeight * m.scale;
        const goingRight = Math.cos(heading) > 0;
        const rot = Math.sin(heading) * 0.35;

        ctx.save();
        ctx.translate(m.x, m.y + bob);
        ctx.rotate(rot);
        ctx.scale(goingRight ? 1 : -1, 1);
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
