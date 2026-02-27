"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Cog, Columns3, FileText, Grid2x2, Layers } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Props = {
  firstName: string | null;
  hasRelevantAgreements: boolean | null;
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
  icon: React.ReactNode;
};

function isOverview(pathname: string) {
  return pathname === "/dashboard";
}

function isScenarios(pathname: string) {
  return pathname === "/dashboard/scenarios" || pathname.startsWith("/dashboard/scenario/") || pathname.startsWith("/dashboard/scenarios/");
}

function isCompare(pathname: string) {
  return pathname === "/dashboard/compare";
}

function isReport(pathname: string) {
  return pathname === "/dashboard/report";
}

function isSettings(pathname: string) {
  return pathname === "/settings";
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    isActive: isOverview,
    icon: <Grid2x2 strokeWidth={1.5} />,
  },
  {
    href: "/dashboard/scenarios",
    label: "Scenarios",
    isActive: isScenarios,
    icon: <Layers strokeWidth={1.5} />,
  },
  {
    href: "/dashboard/compare",
    label: "Compare",
    isActive: isCompare,
    icon: <Columns3 strokeWidth={1.5} />,
  },
  {
    href: "/dashboard/report",
    label: "Report",
    isActive: isReport,
    icon: <FileText strokeWidth={1.5} />,
  },
  {
    href: "/settings",
    label: "Settings",
    isActive: isSettings,
    icon: <Cog strokeWidth={1.5} />,
  },
];

const MOBILE_ITEMS: NavItem[] = [NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[2], NAV_ITEMS[4]].filter(Boolean) as NavItem[];

export default function DashboardShell({ firstName, hasRelevantAgreements, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const hasName = Boolean(firstName?.trim());
  const greeting = hasName ? `Hi ${firstName?.trim()}` : "Hi there";

  const signOut = async () => {
    await supabaseBrowser().auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="dashboard-shell-root">
      <aside className="dashboard-sidebar" aria-label="Primary navigation">
        <div className="dashboard-sidebar-top">
          <Link href="/dashboard" className="dashboard-brand-link" aria-label="Untie home">
            <span className="dashboard-wordmark" aria-hidden>
              UNTIE
            </span>
            <span className="dashboard-wordmark-compact" aria-hidden>
              U
            </span>
          </Link>
          <p className="dashboard-greeting">{greeting}</p>
        </div>

        <nav className="dashboard-nav-list">
          {NAV_ITEMS.map((item) => {
            const active = item.isActive(pathname);
            return (
              <Link key={item.href} href={item.href} className={`dashboard-nav-item${active ? " is-active" : ""}`}>
                <span className="dashboard-nav-icon" aria-hidden>
                  {item.icon}
                </span>
                <span className="dashboard-nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="dashboard-sidebar-bottom">
          <Link href="/onboarding/review" className="dashboard-sidebar-link">
            Edit financial position
          </Link>
          <hr className="dashboard-sidebar-divider" />
          <button type="button" className="dashboard-sidebar-link dashboard-sidebar-danger" onClick={signOut}>
            Log out
          </button>
        </div>
      </aside>

      <main className="dashboard-main" role="main">
        {hasRelevantAgreements === null ? (
          <div className="dashboard-page">
            <section className="dashboard-settings-section">
              <h2 className="dashboard-scenario-name">Finish legal agreement disclosure</h2>
              <p className="dashboard-status">
                Tell us whether any prenup, postnup, or separation agreement may affect your financial position.
              </p>
              <Link href="/settings" className="dashboard-btn-ghost">
                Open settings
              </Link>
            </section>
          </div>
        ) : null}
        {children}
      </main>

      <nav className="dashboard-mobile-nav" aria-label="Mobile navigation">
        {MOBILE_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          return (
            <Link key={item.href} href={item.href} className={`dashboard-mobile-item${active ? " is-active" : ""}`}>
              <span className="dashboard-nav-icon" aria-hidden>
                {item.icon}
              </span>
              <span className="dashboard-mobile-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
