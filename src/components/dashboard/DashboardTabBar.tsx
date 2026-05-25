import Link from "next/link";

export type DashTab = "home" | "program" | "community" | "profile";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  );
}
function CommunityIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" />
      <path d="M16 5.5a3 3 0 0 1 0 5.5M18 20c0-2.4-.9-4-2.5-4.6" />
    </svg>
  );
}
function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}

const TABS: { key: DashTab; href: string; label: string; icon: React.ReactNode }[] = [
  { key: "home", href: "/dashboard", label: "ACASĂ", icon: <HomeIcon /> },
  { key: "program", href: "/dashboard/program", label: "PROGRAM", icon: <CalendarIcon /> },
  { key: "community", href: "/dashboard/board", label: "COMUNITATE", icon: <CommunityIcon /> },
  { key: "profile", href: "/dashboard/profile", label: "PROFIL", icon: <ProfileIcon /> },
];

export default function DashboardTabBar({ active }: { active: DashTab }) {
  return (
    <nav className="m-tabbar">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={"m-tab" + (t.key === active ? " m-tab-active" : "")}
        >
          <span className="m-tab-icon">{t.icon}</span>
          <span className="m-tab-label">{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}
