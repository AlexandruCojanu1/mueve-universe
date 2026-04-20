"use client";
import { useEffect } from "react";

export default function Cursor() {
  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) return;
    const cB = document.getElementById("cBlob");
    const cD = document.getElementById("cDot");
    if (!cB || !cD) return;
    let mx = -300, my = -300, cx = -300, cy = -300, dx = -300, dy = -300;
    let vel = 0, pmx = 0, pmy = 0;
    const onMove = (e: MouseEvent) => {
      const ddx = e.clientX - pmx;
      const ddy = e.clientY - pmy;
      vel = Math.min(Math.sqrt(ddx * ddx + ddy * ddy), 60);
      pmx = e.clientX;
      pmy = e.clientY;
      mx = e.clientX;
      my = e.clientY;
    };
    document.addEventListener("mousemove", onMove);
    let raf = 0;
    const ani = () => {
      cx += (mx - cx) * 0.07;
      cy += (my - cy) * 0.07;
      dx += (mx - dx) * 0.22;
      dy += (my - dy) * 0.22;
      cB.style.transform = `translate(${cx - 110}px,${cy - 110}px)`;
      cD.style.transform = `translate(${dx - 5}px,${dy - 5}px)`;
      const sz = 220 + vel * 4;
      const int = 0.22 + vel * 0.01;
      cB.style.width = sz + "px";
      cB.style.height = sz + "px";
      cB.style.background = `radial-gradient(circle,rgba(245,245,10,${int}) 0%,rgba(250,120,20,${int * 0.5}) 25%,rgba(180,40,220,${int * 0.15}) 50%,transparent 70%)`;
      vel *= 0.9;
      raf = requestAnimationFrame(ani);
    };
    ani();
    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <>
      <div id="cBlob" />
      <div id="cDot" />
    </>
  );
}
