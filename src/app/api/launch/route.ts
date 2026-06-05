import { NextResponse } from "next/server";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export type LaunchState = {
  state: "pre" | "countdown" | "live";
  startAt?: string; // ISO, set when countdown begins
};

export async function GET() {
  const [row] = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, "launch"))
    .limit(1);
  const value = (row?.value as LaunchState | undefined) ?? { state: "live" };
  return NextResponse.json(value, {
    headers: { "Cache-Control": "no-store" },
  });
}
