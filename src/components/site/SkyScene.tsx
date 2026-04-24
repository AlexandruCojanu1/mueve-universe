"use client";
import { useEffect } from "react";
import { useDayNight } from "@/lib/day-night";
import StarfieldBg from "./StarfieldBg";
import DaySky from "./DaySky";
import Birds from "./Birds";

export default function SkyScene() {
  const mode = useDayNight();

  useEffect(() => {
    if (!mode) return;
    const cl = document.body.classList;
    cl.toggle("is-day", mode === "day");
    cl.toggle("is-night", mode !== "day");
  }, [mode]);

  if (mode === "day") {
    return (
      <>
        <DaySky />
        <Birds />
      </>
    );
  }
  return <StarfieldBg />;
}
