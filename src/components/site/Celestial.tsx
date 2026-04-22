"use client";
import { useDayNight } from "@/lib/day-night";
import SunCanvas from "./SunCanvas";

export default function Celestial() {
  const mode = useDayNight();
  const isDay = mode === "day";
  return (
    <div className={"celestial " + (isDay ? "celestial-day" : "celestial-night")}>
      {isDay ? (
        <SunCanvas />
      ) : (
        <div className="cs-moon">
          <div className="cs-moon-body" />
        </div>
      )}
    </div>
  );
}
