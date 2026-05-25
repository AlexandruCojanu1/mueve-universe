import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLeaderboard } from "@/lib/leaderboard";
import { cleanDisplayName } from "@/lib/display-name";
import DashboardTabBar from "@/components/dashboard/DashboardTabBar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function initials(name: string | null | undefined): string {
  const n = cleanDisplayName(name);
  if (!n) return "M";
  const parts = n.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}

export default async function CommunityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=/dashboard/board");

  const board = await getLeaderboard(session.user.id, 100).catch(() => []);

  return (
    <>
      <header className="m-hello">
        <div>
          <div className="m-hello-eyebrow">COMUNITATE</div>
          <h1 className="m-hello-name">Clasament</h1>
        </div>
      </header>

      <section className="m-board" id="board">
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
              <span className="m-board-avatar">{initials(e.name)}</span>
              <span className="m-board-name">
                {cleanDisplayName(e.name) ?? (e.isMe ? "Tu" : "Membru")}
              </span>
              <span className="m-board-meta">
                {e.runs} sesiuni · {e.streak}săpt
              </span>
              <span className="m-board-xp">{e.xp}</span>
            </li>
          ))}
        </ul>
      </section>

      <DashboardTabBar active="community" />
    </>
  );
}
