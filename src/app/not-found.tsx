import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center p-6">
      <div className="space-y-4">
        <div className="text-xs uppercase tracking-widest opacity-60">404</div>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight">
          Pierdut <span className="text-[var(--sun)]">în spațiu</span>
        </h1>
        <p className="opacity-60 text-sm max-w-md mx-auto">
          Pagina nu există sau s-a mutat pe altă orbită.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 px-6 py-3 bg-[var(--sun)] text-[var(--deep)] font-black uppercase text-xs tracking-widest"
        >
          Înapoi la stația centrală
        </Link>
      </div>
    </div>
  );
}
