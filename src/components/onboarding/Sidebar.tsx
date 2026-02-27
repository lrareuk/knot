"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getModuleStatus, moduleFromPathname } from "@/lib/onboarding/progress";
import { MODULES } from "@/types/financial";
import { useFinancialStore } from "@/stores/financial-position";

type SidebarProps = {
  firstName: string | null;
};

function circleClass(status: "complete" | "partial" | "empty", isActive: boolean): string {
  if (status === "complete") {
    return "bg-[#7CAA8E] text-[#121212] border-[#7CAA8E]";
  }
  if (status === "partial") {
    return "bg-[#D4A843] text-[#121212] border-[#D4A843]";
  }
  if (isActive) {
    return "bg-[#121212] text-[#F4F1EA] border-[#C2185B]";
  }
  return "bg-transparent text-[#9A9590] border-[#2A2A2A]";
}

export default function Sidebar({ firstName }: SidebarProps) {
  const pathname = usePathname();
  const activeModuleName = moduleFromPathname(pathname);
  const position = useFinancialStore((state) => state.position);

  return (
    <aside className="hidden h-screen w-[280px] flex-col border-r border-[#2A2A2A] bg-[#1E1E1E] md:sticky md:top-0 md:flex">
      <div className="border-b border-[#2A2A2A] px-8 pt-8 pb-7">
        <p className="font-['Space_Grotesk'] text-base font-bold tracking-[4px] text-[#F4F1EA] uppercase">UNTIE</p>
        <p className="mt-2.5 text-sm text-[#9A9590]">Hi {firstName?.trim() ? firstName : "there"}</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-5">
        <ul>
          {MODULES.map((module, index) => {
            const isActive = activeModuleName === module.name;
            const status = position ? getModuleStatus(module.name, position) : "empty";

            return (
              <li key={module.name}>
                <Link
                  href={module.route}
                  className={`flex items-center gap-3 border-l-2 px-6 py-2.5 transition-colors ${
                    isActive
                      ? "border-[#C2185B] bg-[#121212]"
                      : "border-transparent text-[#9A9590] hover:bg-[#121212]/60"
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center border text-xs font-semibold ${circleClass(
                      status,
                      isActive
                    )}`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-[#F4F1EA]">{module.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[#2A2A2A] px-8 py-6">
        <Link href="/" className="text-[13px] font-medium text-[#9A9590] transition-colors hover:text-[#F4F1EA]">
          Save &amp; exit
        </Link>
      </div>
    </aside>
  );
}
