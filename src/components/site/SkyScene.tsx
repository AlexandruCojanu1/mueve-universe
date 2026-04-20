"use client";
import { useEffect } from "react";
import { useDayNight } from "@/lib/day-night";
import StarfieldBg from "./StarfieldBg";
import DaySky from "./DaySky";

export default function SkyScene() {
  const mode = useDayNight();

  useEffect(() => {
    if (!mode) return;
    const cl = document.body.classList;
    cl.toggle("is-day", mode === "day");
    cl.toggle("is-night", mode !== "day");
  }, [mode]);

  return mode === "day" ? <DaySky /> : <StarfieldBg />;
}
