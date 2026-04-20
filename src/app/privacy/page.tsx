import Link from "next/link";

export const metadata = {
  title: "Politica de Confidențialitate — MUEVE UNIVERSE",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 space-y-6 relative z-10">
      <Link href="/" className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100">
        ← Înapoi acasă
      </Link>
      <h1 className="text-4xl font-black uppercase tracking-tight">
        Politica de Confidențialitate
      </h1>
      <p className="text-sm opacity-60">
        Ultima actualizare: {new Date().toLocaleDateString("ro-RO")}
      </p>

      <section className="space-y-3 text-sm leading-relaxed opacity-85">
        <h2 className="text-xl font-black uppercase mt-6">1. Date colectate</h2>
        <p>
          Colectăm: nume, email, istoricul sesiunilor (date + slot), plățile (via Stripe; noi NU
          stocăm datele cardului), cookie-uri tehnice esențiale.
        </p>

        <h2 className="text-xl font-black uppercase mt-6">2. Scop</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Oferirea serviciului (acces la sesiuni, cont, istoric).</li>
          <li>Procesarea plăților și reînnoirilor prin Stripe.</li>
          <li>Comunicări esențiale (confirmări, notificări de securitate).</li>
        </ul>

        <h2 className="text-xl font-black uppercase mt-6">3. Partajare</h2>
        <p>
          Datele sunt partajate doar cu procesatori esențiali: Stripe (plăți), Google/Apple
          (login + wallet, dacă alegi), furnizor de email (magic links, dacă îl folosești).
        </p>

        <h2 className="text-xl font-black uppercase mt-6">4. Drepturile tale (GDPR)</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Acces la datele tale</li>
          <li>Rectificare sau ștergere</li>
          <li>Export (portabilitate)</li>
          <li>Retragerea consimțământului</li>
          <li>Plângere la ANSPDCP</li>
        </ul>

        <h2 className="text-xl font-black uppercase mt-6">5. Cookie-uri</h2>
        <p>
          Folosim doar cookie-uri esențiale (sesiune de login, preferințe de limbă). Nu folosim
          tracking terț sau reclame. Vezi banner-ul de cookie-uri la prima vizită.
        </p>

        <h2 className="text-xl font-black uppercase mt-6">6. Retenție</h2>
        <p>
          Datele contului se păstrează cât contul este activ. La ștergere, informațiile personale
          sunt eliminate în 30 de zile (cu excepția celor legale obligatorii — facturi, etc.).
        </p>

        <h2 className="text-xl font-black uppercase mt-6">7. Contact</h2>
        <p>
          <a href="mailto:mueve.universe@gmail.com" className="text-[var(--sun)]">
            mueve.universe@gmail.com
          </a>
        </p>
      </section>

      <div className="opacity-40 text-xs mt-10 border-t border-white/10 pt-4">
        * Acest document este un draft. Înlocuiește cu text verificat juridic (GDPR-compliant) înainte de lansare publică.
      </div>
    </div>
  );
}
