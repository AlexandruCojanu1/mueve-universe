"use client";
import { useDayNight } from "@/lib/day-night";

export default function Celestial() {
  const mode = useDayNight();
  const isDay = mode === "day";
  return (
    <div className={"celestial " + (isDay ? "celestial-day" : "celestial-night")}>
      {isDay ? (
        <div className="cs-sun">
          <div className="cs-sun-rays" />
          <div className="cs-sun-rays cs-sun-rays-b" />
          <div className="cs-sun-core" />
        </div>
      ) : (
        <div className="cs-moon">
          <div className="cs-moon-body" />
        </div>
      )}
    </div>
  );
}
