import Link from "next/link";
import { requireActiveAuthContext } from "@/lib/server/auth";

export default async function AdvisorLayout({ children }: { children: React.ReactNode }) {
  await requireActiveAuthContext();

  return (
    <div className="dashboard-shell-root">
      <aside className="dashboard-sidebar" aria-label="Advisor navigation">
        <div className="dashboard-sidebar-top">
          <Link href="/advisor/marketplace/profile" className="dashboard-brand-link" aria-label="Advisor marketplace">
            <span className="dashboard-wordmark logo-wordmark" aria-hidden />
            <span className="dashboard-wordmark-compact logo-wordmark" aria-hidden />
            <span className="sr-only">Untie</span>
          </Link>
          <p className="dashboard-greeting">Advisor portal</p>
        </div>

        <nav className="dashboard-nav-list">
          <Link href="/advisor/marketplace/profile" className="dashboard-nav-item">
            <span className="dashboard-nav-label">Profile</span>
          </Link>
          <Link href="/advisor/marketplace/inquiries" className="dashboard-nav-item">
            <span className="dashboard-nav-label">Inquiries</span>
          </Link>
          <Link href="/dashboard/marketplace" className="dashboard-nav-item">
            <span className="dashboard-nav-label">Client marketplace</span>
          </Link>
        </nav>
      </aside>

      <main className="dashboard-main" role="main">
        {children}
      </main>
    </div>
  );
}
