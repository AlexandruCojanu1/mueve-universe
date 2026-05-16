import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { issueDynamicToken } from "@/lib/qr-dynamic";
import { rateLimitAsync, clientKey } from "@/lib/rate-limit";
import { checkAndBindDevice } from "@/lib/device-binding";

export async function GET(req: Request) {
  const rl = await rateLimitAsync(clientKey(req, "qr-dynamic"), 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const bind = await checkAndBindDevice(session.user.id);
  if (!bind.ok) {
    return NextResponse.json(
      {
        error:
          "Cardul e legat de alt dispozitiv. Loghează-te de pe dispozitivul original sau cere admin reset.",
        deviceMismatch: true,
      },
      { status: 423 },
    );
  }
  const { token, expiresAt } = issueDynamicToken(session.user.id);
  return NextResponse.json({ token, expiresAt, firstBind: bind.firstBind });
}
