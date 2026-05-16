"use client";
import { useEffect, useState } from "react";
import { useDayNight } from "@/lib/day-night";
import StarfieldBg from "./StarfieldBg";
import DaySky from "./DaySky";
import Birds from "./Birds";
import Plane from "./Plane";

export default function SkyScene() {
  const mode = useDayNight();
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    if (!mode) return;
    const cl = document.body.classList;
    cl.toggle("is-day", mode === "day");
    cl.toggle("is-night", mode !== "day");
  }, [mode]);

  useEffect(() => {
    const onScroll = () => {
      const past = window.scrollY > window.innerHeight * 0.6;
      setPastHero((prev) => (prev !== past ? past : prev));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (mode === "day") {
    return (
      <>
        <DaySky />
        {!pastHero && <Birds />}
        {!pastHero && <Plane />}
      </>
    );
  }
  return <StarfieldBg />;
}
