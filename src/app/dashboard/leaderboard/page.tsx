import { auth } from "@/auth";
import {
  getActivity,
  getChallenges,
  getLeaderboard,
  getUserStats,
} from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

const NICE_TIME = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const me = session.user.id;
  const [stats, board, challenges, activity] = await Promise.all([
    getUserStats(me),
    getLeaderboard(me, 10),
    getChallenges(me),
    getActivity(me, 8),
  ]);

  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Run Club</div>
        <h1 className="dash-page-title">Clasament &amp; XP</h1>
        <p className="dash-page-sub">
          Fiecare sesiune îți dă XP. Streak-uri și challenges deblochează
          bonusuri. Atinge NFC-ul de la întâlnire ca să te înregistrezi instant.
        </p>
      </header>

      <section className="lb-grid">
        <div className="lb-card lb-me">
          <div className="lb-me-row">
            <div>
              <div className="lb-me-tier">{stats.tier.name}</div>
              <div className="lb-me-name">{session.user.name || "Tu"}</div>
            </div>
            <div className="lb-me-level">LVL {stats.tier.level}</div>
          </div>
          <div className="lb-xp-bar">
            <div
              className="lb-xp-bar-fill"
              style={{ width: `${Math.round(stats.progressToNext * 100)}%` }}
            />
          </div>
          <div className="lb-xp-meta">
            <span>{stats.xp} XP</span>
            <span>
              {stats.nextTier
                ? `${stats.nextTier.minXp - stats.xp} XP până la ${stats.nextTier.name}`
                : "Nivel maxim — Legend"}
            </span>
          </div>
          <div className="lb-stats-row">
            <Stat label="Sesiuni" value={String(stats.runs)} />
            <Stat label="Streak curent" value={`${stats.currentStreak}sapt`} />
            <Stat label="Cel mai lung streak" value={`${stats.longestStreak}sapt`} />
          </div>
        </div>

        <div className="lb-card lb-board">
          <div className="lb-card-head">
            <span>Top runners</span>
            <span className="lb-card-meta">Top {board.length}</span>
          </div>
          <ol className="lb-list">
            {board.map((e) => (
              <li
                key={e.userId}
                className={"lb-row" + (e.isMe ? " lb-row-me" : "")}
              >
                <span className="lb-rank">#{e.rank}</span>
                <span className="lb-name">{e.name}</span>
                <span className="lb-row-meta">
                  <span className="lb-row-runs">{e.runs} ses</span>
                  <span className="lb-row-streak">{e.streak}sapt</span>
                  <span className="lb-row-xp">{e.xp} XP</span>
                </span>
              </li>
            ))}
            {board.length === 0 && (
              <li className="lb-empty">Niciun runner încă. Fii primul.</li>
            )}
          </ol>
        </div>

        <div className="lb-card lb-challenges">
          <div className="lb-card-head">
            <span>Challenges săptămânale</span>
            <span className="lb-card-meta">+50 XP fiecare</span>
          </div>
          <ul className="lb-ch-list">
            {challenges.map((c) => (
              <li
                key={c.id}
                className={"lb-ch" + (c.done ? " lb-ch-done" : "")}
              >
                <div className="lb-ch-head">
                  <span className="lb-ch-title">{c.title}</span>
                  <span className="lb-ch-reward">
                    {c.done ? "✓ +" + c.reward + " XP" : `+${c.reward} XP`}
                  </span>
                </div>
                <div className="lb-ch-body">{c.description}</div>
                <div className="lb-ch-bar">
                  <div
                    className="lb-ch-bar-fill"
                    style={{ width: `${Math.round(c.progress * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lb-card lb-activity">
          <div className="lb-card-head">
            <span>Activitate recentă</span>
          </div>
          <ul className="lb-act-list">
            {activity.length === 0 && (
              <li className="lb-empty">Niciun XP încă. Vino la o sesiune.</li>
            )}
            {activity.map((a) => (
              <li key={a.id} className="lb-act">
                <span className="lb-act-label">{a.label}</span>
                <span className="lb-act-when">{NICE_TIME.format(a.at)}</span>
                <span className="lb-act-xp">+{a.xp}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lb-nfc">
        <h2 className="lb-nfc-title">Cum funcționează NFC check-in</h2>
        <ol className="lb-nfc-steps">
          <li>Punem un sticker NFC Mueve la locul de meetup (run, yoga, etc.).</li>
          <li>Atingi telefonul de sticker la sosire.</li>
          <li>Se deschide automat pagina Mueve, te-am autentificat deja.</li>
          <li>Prezența + XP se înregistrează instant.</li>
        </ol>
        <p className="lb-nfc-hint">
          Coach-ul tot poate scana QR-ul tău din cardul Mueve. Funcționează în
          ambele direcții.
        </p>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="lb-stat">
      <div className="lb-stat-value">{value}</div>
      <div className="lb-stat-label">{label}</div>
    </div>
  );
}
