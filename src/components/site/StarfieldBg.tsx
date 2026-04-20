"use client";
import { useEffect, useRef } from "react";

export default function StarfieldBg() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const bg = ref.current;
    if (!bg) return;
    const bx = bg.getContext("2d");
    if (!bx) return;
    type Star = { x: number; y: number; r: number; a: number; sp: number; ph: number; drift: number };
    type Shoot = { x: number; y: number; l: number; sp: number; ang: number; life: number };
    const stars: Star[] = [];
    const shoots: Shoot[] = [];
    const NB = 400;
    const sz = () => {
      bg.width = window.innerWidth;
      bg.height = window.innerHeight;
    };
    sz();
    window.addEventListener("resize", sz);
    for (let i = 0; i < NB; i++) {
      stars.push({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight,
        r: Math.random() * 1.2 + 0.2,
        a: Math.random() * 0.7 + 0.2,
        sp: Math.random() * 0.003 + 0.001,
        ph: Math.random() * 6.28,
        drift: Math.random() * 0.15 - 0.075,
      });
    }
    let sTime = 0;
    let raf = 0;
    const draw = () => {
      bx.clearRect(0, 0, bg.width, bg.height);
      sTime += 0.016;
      const g = bx.createLinearGradient(0, 0, 0, bg.height);
      g.addColorStop(0, "#050816");
      g.addColorStop(0.5, "#0A0F2A");
      g.addColorStop(1, "#11183C");
      bx.fillStyle = g;
      bx.fillRect(0, 0, bg.width, bg.height);
      for (const s of stars) {
        const fl = Math.sin(sTime * s.sp * 80 + s.ph) * 0.35 + 0.65;
        s.y += s.drift;
        if (s.y > bg.height + 2) s.y = -2;
        if (s.y < -2) s.y = bg.height + 2;
        bx.beginPath();
        bx.arc(s.x, s.y, s.r, 0, 6.28);
        bx.fillStyle = `rgba(245,245,245,${s.a * fl})`;
        bx.fill();
      }
      if (Math.random() < 0.002 && shoots.length < 2) {
        shoots.push({
          x: Math.random() * bg.width * 0.8,
          y: Math.random() * bg.height * 0.3,
          l: Math.random() * 100 + 50,
          sp: Math.random() * 10 + 5,
          ang: Math.PI / 4 + Math.random() * 0.4,
          life: 1,
        });
      }
      for (let j = shoots.length - 1; j >= 0; j--) {
        const ss = shoots[j];
        ss.x += Math.cos(ss.ang) * ss.sp;
        ss.y += Math.sin(ss.ang) * ss.sp;
        ss.life -= 0.012;
        if (ss.life <= 0) {
          shoots.splice(j, 1);
          continue;
        }
        bx.beginPath();
        bx.moveTo(ss.x, ss.y);
        bx.lineTo(ss.x - Math.cos(ss.ang) * ss.l * ss.life, ss.y - Math.sin(ss.ang) * ss.l * ss.life);
        const sg = bx.createLinearGradient(
          ss.x,
          ss.y,
          ss.x - Math.cos(ss.ang) * ss.l,
          ss.y - Math.sin(ss.ang) * ss.l,
        );
        sg.addColorStop(0, `rgba(245,245,10,${ss.life})`);
        sg.addColorStop(1, "rgba(245,245,10,0)");
        bx.strokeStyle = sg;
        bx.lineWidth = 1.5;
        bx.stroke();
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
