"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Props = {
  firstName: string | null;
  children: React.ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  kind: "route" | "special";
  isActive: (pathname: string) => boolean;
  icon: React.ReactNode;
};

function isOverview(pathname: string) {
  return pathname === "/dashboard";
}

function isScenario(pathname: string) {
  return pathname === "/dashboard/scenarios" || pathname.startsWith("/dashboard/scenarios/") || pathname.startsWith("/dashboard/scenario/");
}

function isCompare(pathname: string) {
  return pathname === "/dashboard/compare";
}

function isReport(pathname: string) {
  return pathname === "/dashboard/report";
}

function isEditFinancials(pathname: string) {
  return pathname === "/onboarding/review";
}

function isSettings(pathname: string) {
  return pathname === "/settings";
}

function IconOverview() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="2" y="2" width="5" height="5" />
      <rect x="9" y="2" width="5" height="5" />
      <rect x="2" y="9" width="5" height="5" />
      <rect x="9" y="9" width="5" height="5" />
    </svg>
  );
}

function IconScenarios() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 3h10M3 8h10M3 13h7" />
    </svg>
  );
}

function IconCompare() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 14V6M8 14V2M12 14V9" />
    </svg>
  );
}

function IconReport() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 2h8v12H4z" />
      <path d="M6 5h4M6 8h4M6 11h2" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M6 2h4M5 5h6M4 8h8M3 11h10" />
    </svg>
  );
}

const ROUTE_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    kind: "route",
    isActive: isOverview,
    icon: <IconOverview />,
  },
  {
    href: "/dashboard/scenarios",
    label: "Scenarios",
    kind: "route",
    isActive: isScenario,
    icon: <IconScenarios />,
  },
  {
    href: "/dashboard/compare",
    label: "Compare",
    kind: "route",
    isActive: isCompare,
    icon: <IconCompare />,
  },
  {
    href: "/dashboard/report",
    label: "Report",
    kind: "route",
    isActive: isReport,
    icon: <IconReport />,
  },
  {
    href: "/onboarding/review",
    label: "Edit financials",
    kind: "special",
    isActive: isEditFinancials,
    icon: <IconEdit />,
  },
];

const MOBILE_ITEMS = ROUTE_ITEMS.filter((item) => item.kind === "route");

export default function DashboardShell({ firstName, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const name = firstName?.trim() || "there";

  useEffect(() => {
    const timer = window.setTimeout(() => setMobileMoreOpen(false), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const signOut = async () => {
    await supabaseBrowser().auth.signOut();
    router.push("/");
    router.refresh();
  };

  const currentLabel = useMemo(() => {
    const active = ROUTE_ITEMS.find((item) => item.isActive(pathname));
    return active?.label ?? "Dashboard";
  }, [pathname]);

  return (
    <div className="dashboard-shell-root">
      <aside className="dashboard-sidebar" aria-label="Primary navigation">
        <div className="dashboard-sidebar-top">
          <Link href="/dashboard" className="dashboard-brand-link" aria-label="Untie home">
            <span className="dashboard-wordmark" aria-hidden />
            <span className="dashboard-wordmark-compact" aria-hidden>
              U
            </span>
          </Link>
          <p className="dashboard-greeting">Hi {name}</p>
        </div>

        <nav className="dashboard-nav-list">
          {ROUTE_ITEMS.map((item) => {
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
          <Link href="/settings" className={`dashboard-sidebar-link${isSettings(pathname) ? " is-active" : ""}`}>
            Settings
          </Link>
          <button type="button" className="dashboard-sidebar-link dashboard-sidebar-danger" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="dashboard-main" role="main">
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
        <button
          type="button"
          className={`dashboard-mobile-item${mobileMoreOpen ? " is-active" : ""}`}
          onClick={() => setMobileMoreOpen((current) => !current)}
          aria-expanded={mobileMoreOpen}
          aria-controls="dashboard-mobile-more"
        >
          <span className="dashboard-mobile-ellipsis" aria-hidden>
            ☰
          </span>
          <span className="dashboard-mobile-label">More</span>
        </button>
      </nav>

      <div id="dashboard-mobile-more" className={`dashboard-mobile-more${mobileMoreOpen ? " is-open" : ""}`}>
        <p className="dashboard-mobile-more-title">{currentLabel}</p>
        <Link href="/settings" className="dashboard-mobile-more-link">
          Settings
        </Link>
        <button type="button" className="dashboard-mobile-more-link dashboard-sidebar-danger" onClick={signOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
