"use client";
import { useEffect, useRef } from "react";

export default function SunCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const sc = ref.current;
    if (!sc) return;
    const sx = sc.getContext("2d");
    if (!sx) return;
    let sunT = 0;
    let raf = 0;
    const draw = () => {
      if (document.hidden) {
        raf = requestAnimationFrame(draw);
        return;
      }
      sunT += 0.01;
      sx.clearRect(0, 0, 360, 360);
      const g1 = sx.createRadialGradient(180, 180, 60, 180, 180, 180);
      g1.addColorStop(0, "rgba(245,245,10,.3)");
      g1.addColorStop(0.4, "rgba(245,245,10,.08)");
      g1.addColorStop(1, "transparent");
      sx.fillStyle = g1;
      sx.fillRect(0, 0, 360, 360);
      const ps = Math.sin(sunT * 2) * 0.15 + 0.85;
      sx.beginPath();
      sx.arc(180, 180, 80 * ps + 40, 0, 6.28);
      sx.strokeStyle = `rgba(245,245,10,${0.06 * ps})`;
      sx.lineWidth = 1;
      sx.stroke();
      const g2 = sx.createRadialGradient(165, 165, 10, 180, 180, 70);
      g2.addColorStop(0, "#FFF9C4");
      g2.addColorStop(0.4, "#F5F50A");
      g2.addColorStop(1, "#C6B800");
      sx.beginPath();
      sx.arc(180, 180, 65 + Math.sin(sunT * 3) * 3, 0, 6.28);
      sx.fillStyle = g2;
      sx.fill();
      for (let i = 0; i < 12; i++) {
        const a = sunT * 0.3 + i * (6.28 / 12);
        const len = 85 + Math.sin(sunT * 2 + i) * 15;
        sx.beginPath();
        sx.moveTo(180 + Math.cos(a) * 72, 180 + Math.sin(a) * 72);
        sx.lineTo(180 + Math.cos(a) * len, 180 + Math.sin(a) * len);
        sx.strokeStyle = `rgba(245,245,10,${0.12 + Math.sin(sunT + i) * 0.06})`;
        sx.lineWidth = 1.5;
        sx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas id="sunCanvas" ref={ref} width={360} height={360} />;
}
