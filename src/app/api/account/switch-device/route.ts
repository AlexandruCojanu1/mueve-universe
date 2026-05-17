import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { switchDeviceToCurrent } from "@/lib/device-binding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const res = await switchDeviceToCurrent(session.user.id);
  if (!res.ok) {
    return NextResponse.json(
      { error: "Acest telefon a fost deja blocat permanent." },
      { status: 403 },
    );
  }
  return NextResponse.json({ ok: true, previousBlocked: res.blocked ?? null });
}
