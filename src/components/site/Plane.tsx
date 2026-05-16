"use client";
import { useEffect, useRef } from "react";

const SRC = "/birds/plane.png";

export default function Plane() {
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

    const img = new Image();
    img.src = SRC;

    // Plane sprite default orientation: nose on LEFT, banner to the RIGHT.
    // We fly it right-to-left across the sky so the nose leads.
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    type Flight = {
      active: boolean;
      x: number;
      y: number;
      vx: number;
      scale: number;
      wobblePhase: number;
      startedAt: number;
      nextStartAt: number;
    };

    const newFlight = (now: number): Flight => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      scale: 0,
      wobblePhase: 0,
      startedAt: 0,
      nextStartAt: now + rand(4000, 9000),
    });

    const beginFlight = (f: Flight, now: number) => {
      const scale = rand(0.14, 0.2) * Math.min(1, window.innerWidth / 1200);
      const spriteW = 1960 * scale;
      f.active = true;
      f.x = window.innerWidth + spriteW;
      f.y = rand(window.innerHeight * 0.18, window.innerHeight * 0.38);
      f.vx = -(130 + Math.random() * 60); // px/sec, right → left
      f.scale = scale;
      f.wobblePhase = Math.random() * Math.PI * 2;
      f.startedAt = now;
    };

    const flight: Flight = newFlight(performance.now());

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
      const dtSec = dtMs / 1000;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (!flight.active && now > flight.nextStartAt) {
        beginFlight(flight, now);
      }

      if (flight.active) {
        flight.x += flight.vx * dtSec;
        flight.wobblePhase += dtMs * 0.0009;
        const bob = Math.sin(flight.wobblePhase) * 4;
        const tilt = Math.cos(flight.wobblePhase) * 0.015;

        const spriteW = 1960 * flight.scale;
        const spriteH = 340 * flight.scale;

        if (flight.x < -spriteW - 200) {
          flight.active = false;
          flight.nextStartAt = now + rand(22000, 45000);
        } else if (img.complete && img.naturalWidth > 0) {
          // Fade in/out at edges for a softer entrance/exit
          const W = window.innerWidth;
          let alpha = 0.95;
          const fadeZone = 120;
          if (flight.x > W - fadeZone)
            alpha *= Math.max(0, (W + spriteW - flight.x) / (spriteW + fadeZone));
          if (flight.x < -spriteW + fadeZone)
            alpha *= Math.max(0, (flight.x + spriteW) / fadeZone);

          ctx.save();
          ctx.globalAlpha = alpha;
          // Anchor on plane nose (left edge of sprite). Draw from (x, y+bob) extending right.
          ctx.translate(flight.x, flight.y + bob);
          ctx.rotate(tilt);
          ctx.drawImage(img, 0, -spriteH / 2, spriteW, spriteH);
          // Overlay "MUEVE" ad text on the banner (right portion of sprite)
          const bannerX = spriteW * 0.28;
          const bannerW = spriteW * 0.68;
          const fontPx = Math.max(14, spriteH * 0.55);
          ctx.font = `900 ${fontPx}px ${"'Space Grotesk', system-ui, sans-serif"}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#0B1A2E";
          ctx.strokeStyle = "rgba(245,245,10,0.85)";
          ctx.lineWidth = Math.max(1, fontPx * 0.05);
          const cx = bannerX + bannerW / 2;
          ctx.strokeText("MUEVE", cx, 0);
          ctx.fillText("MUEVE", cx, 0);
          ctx.restore();
        }
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
        zIndex: 2,
      }}
    />
  );
}
