"use client";
import { useEffect, useState } from "react";

export type Mode = "day" | "night";

export function computeMode(d = new Date()): Mode {
  const h = d.getHours();
  return h >= 8 && h < 18 ? "day" : "night";
}

export function useDayNight(): Mode | null {
  const [mode, setMode] = useState<Mode | null>(null);
  useEffect(() => {
    const apply = () => setMode(computeMode());
    apply();
    const id = setInterval(apply, 60_000);
    return () => clearInterval(id);
  }, []);
  return mode;
}
