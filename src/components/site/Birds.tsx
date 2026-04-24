"use client";
import { useEffect, useRef } from "react";

const FRAMES = [
  "/birds/bird-1.png",
  "/birds/bird-2.png",
  "/birds/bird-3.png",
  "/birds/bird-6.png",
  "/birds/bird-5.png",
];
const CYCLE = FRAMES.length;
const NUM_BIRDS = 6;

type Bird = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bobAmp: number;
  bobFreq: number;
  bobPhase: number;
  scale: number;
  dir: 1 | -1;
  frame: number;
  frameTime: number;
  frameDur: number;
  tilt: number;
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
    const cloudBandMax = () => Math.max(140, H() * 0.32);

    const makeBird = (offscreen = true): Bird => {
      const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
      const scale = 0.05 + Math.random() * 0.06;
      const speed = 0.45 + Math.random() * 0.55;
      return {
        x: offscreen
          ? dir === 1
            ? -120
            : W() + 120
          : Math.random() * W(),
        y: 60 + Math.random() * cloudBandMax() * 1.4,
        vx: speed * dir,
        vy: 0,
        bobAmp: 6 + Math.random() * 10,
        bobFreq: 0.0008 + Math.random() * 0.0007,
        bobPhase: Math.random() * Math.PI * 2,
        scale,
        dir,
        frame: Math.floor(Math.random() * CYCLE),
        frameTime: 0,
        frameDur: 110 + Math.random() * 60,
        tilt: 0,
      };
    };

    const birds: Bird[] = Array.from({ length: NUM_BIRDS }, () => makeBird(false));

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      if (document.hidden) {
        last = now;
        raf = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min(48, now - last);
      last = now;

      ctx.clearRect(0, 0, W(), H());

      for (const b of birds) {
        b.x += b.vx * (dt / 16);

        b.bobPhase += b.bobFreq * dt;
        const bob = Math.sin(b.bobPhase) * b.bobAmp;
        const bobV = Math.cos(b.bobPhase) * b.bobAmp * b.bobFreq * 800;
        b.tilt = bobV * 0.0009 * b.dir;

        b.frameTime += dt;
        if (b.frameTime >= b.frameDur) {
          b.frameTime = 0;
          b.frame = (b.frame + 1) % CYCLE;
        }

        if (
          (b.dir === 1 && b.x > W() + 200) ||
          (b.dir === -1 && b.x < -200)
        ) {
          Object.assign(b, makeBird(true));
        }

        const img = imgs[b.frame];
        if (!img.complete || img.naturalWidth === 0) continue;

        const w = img.naturalWidth * b.scale;
        const h = img.naturalHeight * b.scale;

        ctx.save();
        ctx.translate(b.x, b.y + bob);
        ctx.rotate(b.tilt);
        ctx.scale(b.dir, 1);
        ctx.globalAlpha = 0.92;
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
