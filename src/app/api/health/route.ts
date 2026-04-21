import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const started = Date.now();
  let dbOk = false;
  try {
    await db.execute(sql`select 1`);
    dbOk = true;
  } catch (err) {
    console.error("[health] db check failed", err);
  }
  const body = {
    ok: dbOk,
    db: dbOk,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - started,
  };
  return NextResponse.json(body, { status: dbOk ? 200 : 503 });
}
