"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getModuleStatus, moduleFromPathname } from "@/lib/onboarding/progress";
import { MODULES } from "@/types/financial";
import { useFinancialStore } from "@/stores/financial-position";

type SidebarProps = {
  firstName: string | null;
};

export default function Sidebar({ firstName }: SidebarProps) {
  const pathname = usePathname();
  const activeModuleName = moduleFromPathname(pathname);
  const position = useFinancialStore((state) => state.position);

  return (
    <aside className="onboarding-sidebar" aria-label="Onboarding sidebar">
      <div className="onboarding-sidebar-head">
        <Link href="/" className="onboarding-sidebar-logo-link" aria-label="Untie home">
          <span className="onboarding-sidebar-logo logo-wordmark" aria-hidden />
          <span className="sr-only">Untie</span>
        </Link>
        <p className="onboarding-sidebar-greeting">Hi {firstName?.trim() ? firstName : "there"}</p>
      </div>

      <nav className="onboarding-sidebar-nav" aria-label="Onboarding modules">
        {MODULES.map((module, index) => {
          const isActive = activeModuleName === module.name;
          const status = position ? getModuleStatus(module.name, position) : "empty";

          const dotState = status === "complete" ? "complete" : isActive || status === "partial" ? "progress" : "empty";
          const itemClassName = `onboarding-nav-item ${isActive ? "is-active" : ""} ${status === "complete" ? "is-complete" : ""}`;

          return (
            <Link key={module.name} href={module.route} className={itemClassName.trim()}>
              <span className={`onboarding-nav-dot ${dotState}`}>{index + 1}</span>
              <span className="onboarding-nav-label">{module.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="onboarding-sidebar-footer">
        <Link href="/">Save &amp; exit</Link>
      </div>
    </aside>
  );
}
