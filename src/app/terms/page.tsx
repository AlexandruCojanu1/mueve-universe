import Link from "next/link";

export const metadata = {
  title: "Termeni și Condiții — MUEVE UNIVERSE",
  description:
    "Termenii și condițiile de utilizare a platformei MUEVE UNIVERSE: cont, abonamente, plăți, facturare, drept de retragere, acces la sesiuni.",
};

const LAST_UPDATED = "26 iunie 2026";

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

export default function TermsPage() {
  return (
    <div className="legal-page">
      <Link href="/" className="legal-back">
        ← Înapoi acasă
      </Link>
      <div className="legal-eyebrow">Legal</div>
      <h1 className="legal-title">
        Termeni și
        <br />
        Condiții
      </h1>
      <div className="legal-updated">Ultima actualizare: {LAST_UPDATED}</div>

      <S n="01" title="Cine suntem și ce reglementează acest document">
        <p>
          Platforma MUEVE UNIVERSE, disponibilă la adresa{" "}
          <a href="https://www.mueve.ro">www.mueve.ro</a> (denumită în continuare
          „Platforma"), este operată de <strong>MUEVE COLLECTIVE S.R.L.</strong>, CUI 54738377,
          cu sediul în Constanța, Bd. Tomis nr. 307 („noi"). Ne poți contacta la{" "}
          <a href="mailto:mueve.universe@gmail.com">mueve.universe@gmail.com</a> sau
          la telefon <a href="tel:+40753087056">0753 087 056</a>.
        </p>
        <p>
          Acest document („Termenii") reglementează crearea și utilizarea contului,
          achiziția abonamentului MUEVE UNIVERSE PASS, a pachetelor de sesiuni și
          participarea la activitățile organizate prin Platformă. Prin crearea unui
          cont, prin bifarea acceptului la plată sau prin utilizarea Platformei,
          confirmi că ai citit și accepți Termenii. Dacă nu ești de acord cu ei, te
          rugăm să nu folosești Platforma.
        </p>
      </S>

      <S n="02" title="Contul tău">
        <ul>
          <li>
            Contul este personal și netransmisibil. Ești responsabil de
            confidențialitatea datelor de autentificare și de toate acțiunile făcute
            din contul tău.
          </li>
          <li>
            La înregistrare trebuie să furnizezi date reale și complete. Putem
            suspenda sau închide conturile cu date false, conturile duplicate sau
            conturile folosite abuziv (de exemplu partajarea cardului de acces).
          </li>
          <li>
            Vârsta minimă pentru crearea unui cont este 16 ani. Minorii între 16 și
            18 ani pot participa la sesiuni doar cu acordul părintelui sau al
            tutorelui legal.
          </li>
          <li>
            Îți poți șterge contul oricând printr-o cerere la adresa de contact;
            ștergerea este definitivă și include istoricul de prezențe și punctele
            acumulate.
          </li>
        </ul>
      </S>

      <S n="03" title="Abonamente, pachete și credite">
        <ul>
          <li>
            <strong>MUEVE UNIVERSE PASS</strong> este un abonament lunar cu
            reînnoire automată. Prețul afișat la momentul achiziției se percepe
            lunar până la anulare.
          </li>
          <li>
            Poți anula Pass-ul oricând din contul tău (secțiunea Profil) sau prin
            portalul de facturare Stripe. Anularea oprește următoarea plată, iar
            accesul rămâne activ până la finalul perioadei deja plătite. Nu se
            rambursează perioade parțiale.
          </li>
          <li>
            <strong>Pachetele de sesiuni</strong> (drop-in cu o singură sesiune sau
            pachete cu mai multe sesiuni) sunt achiziții cu plată unică ce adaugă în
            cont un număr de credite de clasă. Achiziția pachetelor necesită un Pass
            activ.
          </li>
          <li>
            Un credit se consumă la rezervarea unei sesiuni. Creditele din pachetele
            cumpărate nu expiră și rămân valabile până la consumare; ele nu sunt
            transmisibile către alte conturi.
          </li>
          <li>
            Dacă anulezi o rezervare cu cel puțin 2 ore înainte de începerea
            sesiunii, creditul revine în cont și poate fi folosit pentru altă clasă.
            Anulările sub 2 ore înainte de începere sau neprezentarea consumă
            creditul.
          </li>
          <li>
            Sesiunile marcate gratuite (de exemplu evenimentele comunitare) nu
            consumă credite.
          </li>
        </ul>
      </S>

      <S n="04" title="Prețuri, plăți și facturare">
        <ul>
          <li>
            Toate prețurile sunt afișate în lei (RON) și sunt finale. Operatorul nu
            este plătitor de TVA.
          </li>
          <li>
            Plățile se procesează exclusiv prin{" "}
            <a href="https://stripe.com" target="_blank" rel="noopener noreferrer">
              Stripe
            </a>
            , un procesator autorizat de plăți. Noi nu stocăm datele cardului tău.
          </li>
          <li>
            Pentru fiecare plată se emite automat o factură fiscală, transmisă pe
            emailul contului și raportată în sistemul național e-Factura, conform
            legislației în vigoare.
          </li>
          <li>
            Plata se face exclusiv online, cu cardul. Pentru tranzacțiile online cu
            cardul nu se emite bon fiscal de casă de marcat; documentul fiscal aferent
            fiecărei plăți este factura, conform OUG nr. 28/1999.
          </li>
          <li>
            Prețurile pot fi modificate; pentru abonamentele active vei fi anunțat
            prin email cu cel puțin 15 zile înainte ca noul preț să se aplice, cu
            posibilitatea de a anula înainte de prima plată la noul preț.
          </li>
        </ul>
      </S>

      <S n="05" title="Dreptul de retragere">
        <p>
          Conform OUG nr. 34/2014 privind drepturile consumatorilor, beneficiezi de
          un termen de 14 zile de retragere pentru contractele încheiate la
          distanță, cu următoarele precizări:
        </p>
        <ul>
          <li>
            Pentru abonament și pachete, dacă în termenul de 14 zile nu ai folosit
            niciun serviciu (nicio prezență, nicio rezervare consumată), poți cere
            rambursarea integrală la adresa de contact.
          </li>
          <li>
            Prin începerea utilizării serviciilor în interiorul celor 14 zile
            (participarea la o sesiune sau consumarea unui credit) îți exprimi
            acordul expres pentru prestarea serviciului și accepți că, pentru
            serviciile deja prestate, se reține contravaloarea proporțională.
          </li>
        </ul>
      </S>

      <S n="06" title="Accesul la sesiuni și regulile comunității">
        <ul>
          <li>
            Accesul la sesiuni se face pe baza cardului digital (cod QR) din cont,
            care este personal și netransmisibil. Partajarea lui poate duce la
            suspendarea contului.
          </li>
          <li>
            Rezervarea locurilor se face din cont, în limita locurilor disponibile.
            Programul sesiunilor poate fi modificat; sesiunile anulate de noi
            returnează automat creditul.
          </li>
          <li>
            Antrenorul poate refuza accesul persoanelor fără abonament sau credit
            valabil, aflate sub influența alcoolului sau a altor substanțe, ori care
            au un comportament care pune în pericol siguranța grupului.
          </li>
          <li>
            Respectă antrenorii și ceilalți participanți. Comportamentul abuziv,
            discriminatoriu sau periculos duce la excluderea din comunitate, fără
            rambursare pentru perioada rămasă.
          </li>
        </ul>
      </S>

      <S n="07" title="Sănătate și răspundere">
        <ul>
          <li>
            Participarea la activitățile fizice se face pe propria răspundere.
            Înainte de a începe un program de antrenament, consultă un medic, mai
            ales dacă ai afecțiuni preexistente, ești însărcinată sau urmezi un
            tratament.
          </li>
          <li>
            Ai obligația să comunici antrenorului orice problemă de sănătate
            relevantă înainte de sesiune și să îți adaptezi efortul la propriul
            nivel.
          </li>
          <li>
            Nu răspundem pentru vătămări rezultate din nerespectarea indicațiilor
            antrenorului, din afecțiuni preexistente nedeclarate sau din folosirea
            necorespunzătoare a echipamentelor.
          </li>
          <li>
            Activitățile în aer liber depind de vreme; sesiunile pot fi reprogramate
            din motive de siguranță.
          </li>
          <li>
            Nu răspundem pentru bunurile personale pierdute sau deteriorate în
            timpul sesiunilor.
          </li>
        </ul>
      </S>

      <S n="08" title="Puncte, niveluri și provocări (XP)">
        <p>
          Sistemul de XP, niveluri, serii (streak) și provocări este un program de
          gamificare fără valoare monetară. Punctele nu pot fi vândute, transferate
          sau convertite în bani ori servicii. Ne rezervăm dreptul de a ajusta
          regulile programului și de a anula punctele obținute prin fraudă (de
          exemplu check-in-uri false sau activități sportive fictive).
        </p>
      </S>

      <S n="09" title="Date personale">
        <p>
          Prelucrarea datelor tale personale (cont, prezențe, plăți) este descrisă
          în{" "}
          <Link href="/privacy">Politica de confidențialitate</Link>, parte
          integrantă a acestor Termeni. Prelucrăm datele conform Regulamentului (UE)
          2016/679 (GDPR).
        </p>
      </S>

      <S n="10" title="Proprietate intelectuală">
        <p>
          Conținutul Platformei (denumire, logo, texte, grafică, structura
          programelor de antrenament) aparține MUEVE UNIVERSE și este protejat de
          legislația proprietății intelectuale. Nu îl poți copia sau folosi în
          scopuri comerciale fără acordul nostru scris.
        </p>
      </S>

      <S n="11" title="Modificarea Termenilor">
        <p>
          Putem actualiza acești Termeni. Versiunea curentă, cu data ultimei
          actualizări, este publicată permanent pe această pagină. Pentru modificări
          semnificative te anunțăm prin email cu cel puțin 15 zile înainte de
          intrarea lor în vigoare; continuarea utilizării Platformei după acea dată
          înseamnă acceptarea noilor Termeni.
        </p>
      </S>

      <S n="12" title="Legea aplicabilă și soluționarea litigiilor">
        <p>
          Acești Termeni sunt guvernați de legea română. Încercăm să rezolvăm
          amiabil orice neînțelegere; ne poți scrie oricând la adresa de contact.
          Dacă nu ajungem la o soluție, te poți adresa:
        </p>
        <ul>
          <li>
            Autorității Naționale pentru Protecția Consumatorilor (ANPC) și
            platformei SAL:{" "}
            <a
              href="https://anpc.ro/ce-este-sal/"
              target="_blank"
              rel="noopener noreferrer"
            >
              anpc.ro/ce-este-sal
            </a>
          </li>
          <li>
            Platformei europene de soluționare online a litigiilor (SOL/ODR):{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
            >
              ec.europa.eu/consumers/odr
            </a>
          </li>
          <li>instanțelor judecătorești competente din România.</li>
        </ul>
      </S>

      <S n="13" title="Contact">
        <p>
          Pentru orice întrebare legată de acești Termeni, de abonament sau de
          facturi, scrie-ne la{" "}
          <a href="mailto:mueve.universe@gmail.com">mueve.universe@gmail.com</a>.
          Răspundem în cel mult 3 zile lucrătoare.
        </p>
      </S>

      <div className="legal-foot">
        MUEVE COLLECTIVE S.R.L. · CUI 54738377 · Constanța, Bd. Tomis nr. 307
        <br />
        www.mueve.ro · mueve.universe@gmail.com · 0753 087 056
      </div>
    </div>
  );
}
