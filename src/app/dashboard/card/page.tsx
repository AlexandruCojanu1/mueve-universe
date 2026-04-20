import { auth } from "@/auth";
import { ensureQrToken } from "@/lib/qr-token";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export default async function CardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const token = await ensureQrToken(session.user.id);
  const dataUrl = await QRCode.toDataURL(token, {
    margin: 1,
    color: { dark: "#050816", light: "#F5F50A" },
    width: 512,
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black uppercase tracking-tight">Cardul meu</h1>
        <p className="opacity-60 mt-2 text-sm">
          Arată coach-ului acest QR la intrarea în sesiune.
        </p>
      </header>

      <div className="max-w-md mx-auto bg-gradient-to-br from-[var(--sun)] to-amber-500 text-[var(--deep)] rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold opacity-70">
              Member Card
            </div>
            <div className="font-black text-2xl italic tracking-wider">MUEVE UNIVERSE</div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt="QR code" className="w-full h-auto" />
        </div>
        <div className="mt-6 space-y-1">
          <div className="text-xs opacity-80 uppercase tracking-widest font-bold">
            {session.user.name || "Membru"}
          </div>
          <div className="text-xs opacity-70">{session.user.email}</div>
        </div>
      </div>

      <div className="opacity-60 text-xs uppercase tracking-widest text-center">
        Phase 4: acest card va intra automat în Apple Wallet / Google Pay
      </div>
    </div>
  );
}
