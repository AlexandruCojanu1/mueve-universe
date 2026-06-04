import Link from "next/link";

export const metadata = {
  title: "Politica de Confidențialitate — MUEVE UNIVERSE",
  description:
    "Cum prelucrează MUEVE UNIVERSE datele tale personale: ce colectăm, în ce scop, cu cine partajăm și care sunt drepturile tale GDPR.",
};

const LAST_UPDATED = "4 iunie 2026";

function S({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="legal-section">
      <h2>
        <span>{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <Link href="/" className="legal-back">
        ← Înapoi acasă
      </Link>
      <div className="legal-eyebrow">Legal</div>
      <h1 className="legal-title">
        Politica de
        <br />
        Confidențialitate
      </h1>
      <div className="legal-updated">Ultima actualizare: {LAST_UPDATED}</div>

      <S n="01" title="Operatorul de date">
        <p>
          MUEVE UNIVERSE, prin platforma{" "}
          <a href="https://www.mueve.ro">www.mueve.ro</a>, este operatorul datelor
          tale personale în sensul Regulamentului (UE) 2016/679 (GDPR). Ne poți
          contacta pentru orice aspect legat de date la{" "}
          <a href="mailto:mueve.universe@gmail.com">mueve.universe@gmail.com</a>.
        </p>
      </S>

      <S n="02" title="Ce date colectăm">
        <ul>
          <li>
            <strong>Date de cont:</strong> nume, adresă de email, parolă (stocată
            criptat), genul (dacă alegi să îl declari), data creării contului.
          </li>
          <li>
            <strong>Date de utilizare:</strong> rezervări, prezențe la sesiuni
            (dată, oră, clasă), puncte XP, niveluri și provocări.
          </li>
          <li>
            <strong>Date de plată:</strong> istoricul plăților și al abonamentului.
            Datele cardului sunt procesate exclusiv de Stripe; noi nu le vedem și nu
            le stocăm niciodată.
          </li>
          <li>
            <strong>Date de facturare:</strong> numele și emailul de pe facturile
            emise prin Oblio și raportate în e-Factura, conform obligațiilor legale.
          </li>
          <li>
            <strong>Strava (opțional):</strong> dacă îți conectezi contul Strava,
            primim activitățile tale sportive (tip, distanță, dată) pentru
            acordarea XP. Poți deconecta oricând din profil.
          </li>
          <li>
            <strong>Cookie-uri:</strong> doar cookie-uri esențiale (sesiunea de
            login, preferința de limbă). Fără tracking terț, fără reclame.
          </li>
        </ul>
      </S>

      <S n="03" title="De ce le prelucrăm (temeiuri)">
        <ul>
          <li>
            <strong>Executarea contractului:</strong> contul, rezervările, accesul
            la sesiuni, procesarea plăților și a abonamentului.
          </li>
          <li>
            <strong>Obligații legale:</strong> emiterea și păstrarea facturilor,
            raportarea e-Factura, evidențe contabile.
          </li>
          <li>
            <strong>Interes legitim:</strong> securitatea platformei (limitare de
            abuz, prevenirea partajării cardului de acces), funcționarea programului
            de gamificare.
          </li>
          <li>
            <strong>Consimțământ:</strong> integrarea Strava și comunicările
            opționale. Îl poți retrage oricând, fără a afecta serviciile de bază.
          </li>
        </ul>
      </S>

      <S n="04" title="Cu cine partajăm datele">
        <p>
          Nu vindem datele tale. Le partajăm doar cu furnizori esențiali pentru
          funcționarea serviciului, în baza unor acorduri de prelucrare:
        </p>
        <ul>
          <li>Stripe (procesarea plăților)</li>
          <li>Oblio (emiterea facturilor) și ANAF/SPV (e-Factura, obligație legală)</li>
          <li>Google și Apple (autentificare și wallet digital, dacă le folosești)</li>
          <li>Strava (doar dacă îți conectezi contul)</li>
          <li>Vercel și Neon (găzduirea aplicației și a bazei de date, în UE)</li>
          <li>furnizorul de email tranzacțional (confirmări, resetare parolă)</li>
        </ul>
      </S>

      <S n="05" title="Cât timp păstrăm datele">
        <ul>
          <li>Datele contului: cât timp contul este activ.</li>
          <li>
            La ștergerea contului: datele personale sunt eliminate în cel mult 30 de
            zile.
          </li>
          <li>
            Facturile și evidențele financiar-contabile: termenul legal de arhivare
            (în prezent 5 ani), chiar dacă îți ștergi contul.
          </li>
        </ul>
      </S>

      <S n="06" title="Drepturile tale (GDPR)">
        <ul>
          <li>dreptul de acces la datele tale;</li>
          <li>dreptul la rectificare și la ștergere („dreptul de a fi uitat");</li>
          <li>dreptul la restricționarea prelucrării și dreptul la opoziție;</li>
          <li>dreptul la portabilitatea datelor;</li>
          <li>dreptul de a-ți retrage consimțământul, oricând;</li>
          <li>
            dreptul de a depune o plângere la ANSPDCP:{" "}
            <a
              href="https://www.dataprotection.ro"
              target="_blank"
              rel="noopener noreferrer"
            >
              dataprotection.ro
            </a>
            .
          </li>
        </ul>
        <p>
          Pentru exercitarea oricărui drept, scrie-ne la{" "}
          <a href="mailto:mueve.universe@gmail.com">mueve.universe@gmail.com</a>.
          Răspundem în cel mult 30 de zile.
        </p>
      </S>

      <S n="07" title="Securitate">
        <p>
          Folosim conexiuni criptate (HTTPS), parole stocate cu algoritmi de hashing
          moderni, acces restricționat la baza de date și procesatori care respectă
          standardele industriei. Niciun sistem nu este însă infailibil; dacă apare
          un incident de securitate cu risc pentru tine, te notificăm conform legii.
        </p>
      </S>

      <S n="08" title="Modificări">
        <p>
          Versiunea curentă a acestei politici, cu data ultimei actualizări, este
          publicată permanent pe această pagină. Pentru modificări semnificative te
          anunțăm prin email.
        </p>
      </S>

      <div className="legal-foot">
        MUEVE UNIVERSE · www.mueve.ro · mueve.universe@gmail.com
      </div>
    </div>
  );
}
