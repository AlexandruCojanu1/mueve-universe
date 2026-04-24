"use client";
import { useEffect, useRef } from "react";

export default function SunCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const sc = ref.current;
    if (!sc) return;
    const sx = sc.getContext("2d");
    if (!sx) return;
    const SIZE = 540;
    const C = SIZE / 2;
    let sunT = 0;
    let raf = 0;
    const draw = () => {
      if (document.hidden) {
        raf = requestAnimationFrame(draw);
        return;
      }
      sunT += 0.01;
      sx.clearRect(0, 0, SIZE, SIZE);
      const g1 = sx.createRadialGradient(C, C, 90, C, C, 270);
      g1.addColorStop(0, "rgba(245,245,10,.3)");
      g1.addColorStop(0.4, "rgba(245,245,10,.08)");
      g1.addColorStop(1, "transparent");
      sx.fillStyle = g1;
      sx.fillRect(0, 0, SIZE, SIZE);
      const ps = Math.sin(sunT * 2) * 0.15 + 0.85;
      sx.beginPath();
      sx.arc(C, C, 120 * ps + 60, 0, 6.28);
      sx.strokeStyle = `rgba(245,245,10,${0.06 * ps})`;
      sx.lineWidth = 1.5;
      sx.stroke();
      const g2 = sx.createRadialGradient(C - 22, C - 22, 15, C, C, 105);
      g2.addColorStop(0, "#FFF9C4");
      g2.addColorStop(0.4, "#F5F50A");
      g2.addColorStop(1, "#C6B800");
      sx.beginPath();
      sx.arc(C, C, 98 + Math.sin(sunT * 3) * 4, 0, 6.28);
      sx.fillStyle = g2;
      sx.fill();
      for (let i = 0; i < 12; i++) {
        const a = sunT * 0.3 + i * (6.28 / 12);
        const len = 128 + Math.sin(sunT * 2 + i) * 22;
        sx.beginPath();
        sx.moveTo(C + Math.cos(a) * 108, C + Math.sin(a) * 108);
        sx.lineTo(C + Math.cos(a) * len, C + Math.sin(a) * len);
        sx.strokeStyle = `rgba(245,245,10,${0.12 + Math.sin(sunT + i) * 0.06})`;
        sx.lineWidth = 2;
        sx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas id="sunCanvas" ref={ref} width={540} height={540} />;
}
