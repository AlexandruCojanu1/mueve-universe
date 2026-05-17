import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLeaderboard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function initials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

export default async function BoardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=/dashboard/board");

  const board = await getLeaderboard(session.user.id, 100).catch(() => []);

  return (
    <>
      <div className="m-top-row">
        <Link href="/dashboard" className="m-back-link">
          ← Dashboard
        </Link>
      </div>

      <section className="m-board" id="board" style={{ marginTop: "1rem" }}>
        <div className="m-section-eyebrow">LEADERBOARD</div>
        <ul className="m-board-list">
          {board.length === 0 && (
            <li className="m-crew-empty">Niciun runner încă.</li>
          )}
          {board.map((e) => (
            <li
              key={e.userId}
              className={"m-board-row" + (e.isMe ? " m-board-row-me" : "")}
            >
              <span className="m-board-rank">#{e.rank}</span>
              <span className="m-board-avatar">
                {initials(e.name, e.email)}
              </span>
              <span className="m-board-name">{e.name}</span>
              <span className="m-board-meta">
                {e.runs} runs · {e.streak}wk
              </span>
              <span className="m-board-xp">{e.xp}</span>
            </li>
          ))}
        </ul>
      </section>

      <nav className="m-tabbar">
        <Link href="/dashboard" className="m-tab">
          <span className="m-tab-label">HOME</span>
        </Link>
        <Link href="/dashboard/board" className="m-tab m-tab-active">
          <span className="m-tab-label">BOARD</span>
        </Link>
      </nav>
    </>
  );
}
