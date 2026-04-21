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

    // cloud y constrained to top band only — never overlaps hero text
    const cloudBandMax = () => Math.max(120, window.innerHeight * 0.22);

    for (let i = 0; i < 8; i++) {
      clouds.push({
        x: Math.random() * window.innerWidth,
        y: 40 + Math.random() * cloudBandMax(),
        w: 260 + Math.random() * 320,
        h: 40 + Math.random() * 40,
        sp: 0.05 + Math.random() * 0.18,
        op: 0.55 + Math.random() * 0.25,
      });
    }

    for (let i = 0; i < 6; i++) {
      gulls.push({
        x: Math.random() * window.innerWidth,
        y: 80 + Math.random() * cloudBandMax() * 1.4,
        sp: 0.4 + Math.random() * 0.6,
        wing: Math.random() * 6.28,
        scale: 1.1 + Math.random() * 0.9,
        dir: Math.random() > 0.5 ? 1 : -1,
      });
    }

    // Deterministic puff offsets per cloud — assigned once so clouds don't morph each frame
    type Puff = { dx: number; dy: number; r: number };
    const puffs: Puff[][] = clouds.map((c) => {
      const list: Puff[] = [];
      const count = 7 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        list.push({
          dx: t * c.w + (Math.random() - 0.5) * c.h * 0.6,
          dy: (Math.random() - 0.5) * c.h * 1.1 - Math.sin(t * Math.PI) * c.h * 0.4,
          r: c.h * (0.55 + Math.random() * 0.55),
        });
      }
      return list;
    });

    let raf = 0;
    const draw = () => {
      const g = bx.createLinearGradient(0, 0, 0, bg.height);
      g.addColorStop(0, "#4C87B8");
      g.addColorStop(0.55, "#78AED1");
      g.addColorStop(1, "#B8D8EC");
      bx.fillStyle = g;
      bx.fillRect(0, 0, bg.width, bg.height);

      // Soft sun haze near top-center — adds atmospheric realism
      const sun = bx.createRadialGradient(bg.width * 0.5, bg.height * 0.12, 0, bg.width * 0.5, bg.height * 0.12, bg.height * 0.55);
      sun.addColorStop(0, "rgba(255,240,200,0.22)");
      sun.addColorStop(1, "rgba(255,240,200,0)");
      bx.fillStyle = sun;
      bx.fillRect(0, 0, bg.width, bg.height);

      bx.save();
      bx.filter = "blur(8px)";
      for (let i = 0; i < clouds.length; i++) {
        const c = clouds[i];
        c.x += c.sp;
        if (c.x - c.w > bg.width) c.x = -c.w;
        bx.fillStyle = `rgba(255,255,255,${c.op})`;
        bx.beginPath();
        for (const p of puffs[i]) {
          bx.arc(c.x + p.dx, c.y + p.dy, p.r, 0, 6.28);
        }
        bx.fill();
      }
      bx.restore();

      for (const gl of gulls) {
        gl.x += gl.sp * gl.dir;
        gl.wing += 0.12;
        if (gl.dir === 1 && gl.x > bg.width + 30) {
          gl.x = -30;
          gl.y = 80 + Math.random() * cloudBandMax() * 1.4;
        }
        if (gl.dir === -1 && gl.x < -30) {
          gl.x = bg.width + 30;
          gl.y = 80 + Math.random() * cloudBandMax() * 1.4;
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
