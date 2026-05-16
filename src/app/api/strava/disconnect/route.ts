import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { disconnectStrava } from "@/lib/strava";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await disconnectStrava(session.user.id);
  return NextResponse.json({ ok: true });
}
