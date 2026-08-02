import { NextResponse } from "next/server";
import { db } from "@/db";
import { appSettings, sections } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export type LaunchWinners = {
  /** Single winner, drawn at random across all gate entries. */
  winner: { name: string | null; gender: "f" | "m" } | null;
  shownAt: string;
} | null;

export type LaunchState = {
  state: "pre" | "countdown" | "live";
  startAt?: string; // ISO, set when countdown begins
  /** Gate ON: site opens only after visitors leave name + email. */
  gate?: boolean;
  /** When set, every open phone shows the raffle winner fullscreen. */
  winners?: LaunchWinners;
  /** Content version: max(sections.updatedAt) in ms. Clients soft-refresh when it changes. */
  v?: number;
};

export async function GET() {
  const [[row], [ver]] = await Promise.all([
    db
      .select({ value: appSettings.value })
      .from(appSettings)
      .where(eq(appSettings.key, "launch"))
      .limit(1),
    db.select({ max: sql<string | null>`max(${sections.updatedAt})` }).from(sections),
  ]);
  const value = (row?.value as LaunchState | undefined) ?? { state: "live" };
  const v = ver?.max ? new Date(ver.max).getTime() : 0;
  return NextResponse.json(
    { ...value, v },
    { headers: { "Cache-Control": "no-store" } },
  );
}
