"use client";
import { useEffect, useRef } from "react";

export default function DaySky() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const bg = ref.current;
    if (!bg) return;
    const bx = bg.getContext("2d");
    if (!bx) return;

    type Cloud = { x: number; y: number; w: number; h: number; sp: number; op: number };
    type Gull = { x: number; y: number; sp: number; wing: number; scale: number; dir: 1 | -1 };
    const clouds: Cloud[] = [];
    const gulls: Gull[] = [];

    const sz = () => {
      bg.width = window.innerWidth;
      bg.height = window.innerHeight;
    };
    sz();
    window.addEventListener("resize", sz);

    for (let i = 0; i < 10; i++) {
      clouds.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 0.55,
        w: 180 + Math.random() * 260,
        h: 26 + Math.random() * 36,
        sp: 0.06 + Math.random() * 0.22,
        op: 0.18 + Math.random() * 0.25,
      });
    }

    for (let i = 0; i < 6; i++) {
      gulls.push({
        x: Math.random() * window.innerWidth,
        y: 80 + Math.random() * window.innerHeight * 0.5,
        sp: 0.4 + Math.random() * 0.6,
        wing: Math.random() * 6.28,
        scale: 1.1 + Math.random() * 0.9,
        dir: Math.random() > 0.5 ? 1 : -1,
      });
    }

    let raf = 0;
    const draw = () => {
      const g = bx.createLinearGradient(0, 0, 0, bg.height);
      g.addColorStop(0, "#1E4568");
      g.addColorStop(0.5, "#2E6690");
      g.addColorStop(1, "#4A8AB5");
      bx.fillStyle = g;
      bx.fillRect(0, 0, bg.width, bg.height);

      for (const c of clouds) {
        c.x += c.sp;
        if (c.x - c.w > bg.width) c.x = -c.w;
        bx.save();
        bx.fillStyle = `rgba(255,255,255,${c.op})`;
        bx.beginPath();
        bx.arc(c.x, c.y, c.h * 0.6, 0, 6.28);
        bx.arc(c.x + c.w * 0.22, c.y - c.h * 0.25, c.h * 0.85, 0, 6.28);
        bx.arc(c.x + c.w * 0.48, c.y - c.h * 0.08, c.h * 0.75, 0, 6.28);
        bx.arc(c.x + c.w * 0.72, c.y - c.h * 0.12, c.h * 0.65, 0, 6.28);
        bx.arc(c.x + c.w * 0.92, c.y + c.h * 0.04, c.h * 0.5, 0, 6.28);
        bx.fill();
        bx.restore();
      }

      for (const gl of gulls) {
        gl.x += gl.sp * gl.dir;
        gl.wing += 0.12;
        if (gl.dir === 1 && gl.x > bg.width + 30) {
          gl.x = -30;
          gl.y = 80 + Math.random() * bg.height * 0.55;
        }
        if (gl.dir === -1 && gl.x < -30) {
          gl.x = bg.width + 30;
          gl.y = 80 + Math.random() * bg.height * 0.55;
        }
        const flap = Math.sin(gl.wing);
        bx.save();
        bx.translate(gl.x, gl.y);
        bx.scale(gl.scale * gl.dir, gl.scale);
        bx.strokeStyle = "rgba(20,30,55,0.78)";
        bx.lineWidth = 1.8;
        bx.lineCap = "round";
        bx.beginPath();
        bx.moveTo(-14, 0);
        bx.quadraticCurveTo(-7, -6 - flap * 6, 0, -1);
        bx.quadraticCurveTo(7, -6 - flap * 6, 14, 0);
        bx.stroke();
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
