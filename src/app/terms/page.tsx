import Link from "next/link";

export const metadata = {
  title: "Termeni și Condiții — MUEVE UNIVERSE",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 space-y-6 relative z-10">
      <Link href="/" className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100">
        ← Înapoi acasă
      </Link>
      <h1 className="text-4xl font-black uppercase tracking-tight">Termeni și Condiții</h1>
      <p className="text-sm opacity-60">
        Ultima actualizare: {new Date().toLocaleDateString("ro-RO")}
      </p>

      <section className="space-y-3 text-sm leading-relaxed opacity-85">
        <h2 className="text-xl font-black uppercase mt-6">1. Obiect</h2>
        <p>
          Acest document reglementează utilizarea platformei MUEVE UNIVERSE și achiziția de
          abonamente/sesiuni. Prin crearea unui cont sau plată accepți acești termeni.
        </p>

        <h2 className="text-xl font-black uppercase mt-6">2. Abonamente și plăți</h2>
        <p>
          Plățile sunt procesate prin Stripe. Abonamentele se reînnoiesc automat până la anulare.
          Poți anula oricând din <Link href="/dashboard" className="text-[var(--sun)]">contul tău</Link>,
          iar accesul continuă până la finalul perioadei plătite.
        </p>

        <h2 className="text-xl font-black uppercase mt-6">3. Accesul la sesiuni</h2>
        <p>
          Cardul digital (QR) este personal și netransmisibil. Coach-ul poate refuza accesul dacă
          utilizatorul nu are abonament activ sau o sesiune drop-in plătită în ultimele 7 zile.
        </p>

        <h2 className="text-xl font-black uppercase mt-6">4. Răspundere</h2>
        <p>
          Participarea la activitățile fizice se face pe răspunderea proprie. MUEVE UNIVERSE nu
          răspunde pentru accidente sau afecțiuni preexistente. Consultă medicul înainte de a
          începe un program de antrenament.
        </p>

        <h2 className="text-xl font-black uppercase mt-6">5. Modificări</h2>
        <p>
          Ne rezervăm dreptul de a modifica acești termeni. Vei fi notificat prin email la
          modificări semnificative.
        </p>

        <h2 className="text-xl font-black uppercase mt-6">6. Contact</h2>
        <p>
          Întrebări? Scrie-ne la{" "}
          <a href="mailto:mueve.universe@gmail.com" className="text-[var(--sun)]">
            mueve.universe@gmail.com
          </a>
          .
        </p>
      </section>

      <div className="opacity-40 text-xs mt-10 border-t border-white/10 pt-4">
        * Acest document este un draft. Înlocuiește cu text juridic verificat înainte de lansare publică.
      </div>
    </div>
  );
}
