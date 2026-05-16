import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { unbindDevice } from "@/lib/device-binding";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { userId?: string };
  if (!body.userId) {
    return NextResponse.json({ error: "Lipsește userId." }, { status: 400 });
  }
  await unbindDevice(body.userId);
  return NextResponse.json({ ok: true });
}
