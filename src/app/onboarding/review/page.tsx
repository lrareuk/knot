"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { formatPounds } from "@/lib/onboarding/currency";
import { getFinancialTotals } from "@/lib/onboarding/totals";
import { getModuleStatus } from "@/lib/onboarding/progress";
import { MODULES, type FinancialPosition, type ModuleName } from "@/types/financial";
import { useFinancialStore } from "@/stores/financial-position";

type SummaryCard = {
  moduleName: ModuleName;
  lines: string[];
};

function summaryForModule(position: FinancialPosition, moduleName: ModuleName): string[] {
  if (moduleName === "dates") {
    const lines: string[] = [];
    if (position.date_of_marriage) {
      lines.push(`Date of marriage: ${position.date_of_marriage}`);
    }
    if (position.date_of_separation) {
      lines.push(`Date of separation: ${position.date_of_separation}`);
    }
    return lines;
  }

  if (moduleName === "property") {
    return position.properties
      .filter((property) => property.current_value !== null || property.mortgage_outstanding !== null)
      .slice(0, 3)
      .map((property) => {
        const equity = (property.current_value ?? 0) - (property.mortgage_outstanding ?? 0);
        return `${property.label || "Property"}: ${formatPounds(equity)} equity`;
      });
  }

  if (moduleName === "income") {
    const lines: string[] = [];
    if (position.income.user_net_monthly !== null) {
      lines.push(`Your net monthly income: ${formatPounds(position.income.user_net_monthly)}`);
    }
    if (position.income.partner_net_monthly !== null) {
      lines.push(`Partner net monthly income: ${formatPounds(position.income.partner_net_monthly)}`);
    }
    if (position.income.other_income !== null) {
      lines.push(`Other income: ${formatPounds(position.income.other_income)}`);
    }
    return lines;
  }

  if (moduleName === "pensions") {
    return position.pensions
      .filter((pension) => pension.current_value !== null || pension.annual_amount !== null)
      .slice(0, 3)
      .map((pension) => {
        const value = pension.current_value ?? pension.annual_amount;
        return `${pension.label || "Pension"}: ${formatPounds(value)}`;
      });
  }

  if (moduleName === "savings") {
    return position.savings
      .filter((savings) => savings.current_value !== null)
      .slice(0, 3)
      .map((savings) => `${savings.label || "Account"}: ${formatPounds(savings.current_value)}`);
  }

  if (moduleName === "debts") {
    return position.debts
      .filter((debt) => debt.outstanding !== null)
      .slice(0, 3)
      .map((debt) => `${debt.label || "Debt"}: ${formatPounds(debt.outstanding)} outstanding`);
  }

  const lines: string[] = [];
  if (position.has_no_dependants) {
    lines.push("No dependant children");
  } else if (position.dependants.length) {
    lines.push(`Dependants: ${position.dependants.length}`);
  }

  const expenditureTotal = Object.values(position.expenditure).reduce((sum, value) => sum + (value ?? 0), 0);
  if (expenditureTotal > 0) {
    lines.push(`Monthly expenditure: ${formatPounds(expenditureTotal)}`);
  }
  return lines;
}

function completionDot(status: "complete" | "partial" | "empty"): string {
  if (status === "complete") {
    return "bg-[#7CAA8E]";
  }
  if (status === "partial") {
    return "bg-[#D4A843]";
  }
  return "bg-[#2A2A2A]";
}

export default function OnboardingReviewPage() {
  const router = useRouter();
  const position = useFinancialStore((state) => state.position);
  const [isCompleting, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moduleCards = useMemo((): SummaryCard[] => {
    if (!position) {
      return [];
    }

    return MODULES.map((module) => ({
      moduleName: module.name,
      lines: summaryForModule(position, module.name),
    }));
  }, [position]);

  const totals = useMemo(() => {
    if (!position) {
      return null;
    }
    return getFinancialTotals(position);
  }, [position]);

  if (!position || !totals) {
    return null;
  }

  const hasEmptyModule = MODULES.some((module) => getModuleStatus(module.name, position) === "empty");

  const markOnboardingComplete = async () => {
    setCompleting(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const targetUserId = user?.id ?? position.user_id;

    const { error: updateError } = await supabase
      .from("users")
      .update({ onboarding_done: true })
      .eq("id", targetUserId);

    if (updateError) {
      setError("Unable to complete onboarding right now. Please try again.");
      setCompleting(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <main className="mx-auto max-w-[800px] px-6 py-12">
      <header className="mb-8 space-y-3">
        <h1 className="font-['Space_Grotesk'] text-[32px] font-bold text-[#F4F1EA]">Review your financial position</h1>
        <p className="text-sm leading-relaxed text-[#9A9590]">
          Check everything looks right. You can edit any section, and you can always make changes from your dashboard.
        </p>
      </header>

      <section className="space-y-3">
        {MODULES.map((module, index) => {
          const card = moduleCards[index];
          const status = getModuleStatus(module.name, position);

          return (
            <article key={module.name} className="border border-[#2A2A2A] bg-[#1E1E1E] p-6">
              <header className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 ${completionDot(status)}`} />
                  <h2 className="font-['Space_Grotesk'] text-base font-semibold text-[#F4F1EA]">{module.title}</h2>
                </div>
                <Link href={module.route} className="text-sm text-[#C2185B] hover:text-[#F4F1EA]">
                  Edit
                </Link>
              </header>

              {card?.lines.length ? (
                <div className="space-y-1">
                  {card.lines.map((line) => (
                    <p key={line} className="text-sm text-[#9A9590]">
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#555555]">No data entered yet</p>
              )}
            </article>
          );
        })}
      </section>

      <section className="mt-6 border border-[#2A2A2A] bg-[#1E1E1E] p-8">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-base text-[#9A9590]">
            <span>Total property equity</span>
            <span className="font-['Space_Grotesk'] font-semibold text-[#F4F1EA]">{formatPounds(totals.totalPropertyEquity)}</span>
          </div>
          <div className="flex items-center justify-between text-base text-[#9A9590]">
            <span>Total pensions</span>
            <span className="font-['Space_Grotesk'] font-semibold text-[#F4F1EA]">{formatPounds(totals.totalPensions)}</span>
          </div>
          <div className="flex items-center justify-between text-base text-[#9A9590]">
            <span>Total savings</span>
            <span className="font-['Space_Grotesk'] font-semibold text-[#F4F1EA]">{formatPounds(totals.totalSavings)}</span>
          </div>
          <div className="flex items-center justify-between text-base text-[#9A9590]">
            <span>Total debts</span>
            <span className="font-['Space_Grotesk'] font-semibold text-[#F4F1EA]">{formatPounds(totals.totalDebts)}</span>
          </div>

          <div className="mt-3 border-t border-[#2A2A2A] pt-4">
            <div className="flex items-center justify-between text-base font-semibold text-[#F4F1EA]">
              <span>Net position</span>
              <span className="font-['Space_Grotesk'] text-xl text-[#C2185B]">{formatPounds(totals.netPosition)}</span>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between text-base text-[#9A9590]">
              <span>Combined monthly income</span>
              <span className="font-['Space_Grotesk'] font-semibold text-[#F4F1EA]">{formatPounds(totals.combinedMonthlyIncome)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-base text-[#9A9590]">
              <span>Combined monthly expenditure</span>
              <span className="font-['Space_Grotesk'] font-semibold text-[#F4F1EA]">{formatPounds(totals.combinedMonthlyExpenditure)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-base text-[#9A9590]">
              <span>Monthly surplus/deficit</span>
              <span className="font-['Space_Grotesk'] font-semibold text-[#F4F1EA]">{formatPounds(totals.monthlySurplusDeficit)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 text-center">
        {hasEmptyModule ? (
          <p className="mx-auto mb-4 max-w-[620px] text-sm text-[#9A9590]">
            Some sections are incomplete. Your scenarios will be more accurate with more data, but you can always add it later.
          </p>
        ) : null}

        <button
          type="button"
          onClick={markOnboardingComplete}
          disabled={isCompleting}
          className="mx-auto block h-[52px] w-full max-w-[400px] rounded-none bg-[#C2185B] px-4 text-sm font-semibold tracking-wider text-[#F4F1EA] uppercase transition-colors hover:bg-[#D81B60] disabled:opacity-70"
        >
          {isCompleting ? "Saving..." : "Go to your dashboard"}
        </button>

        {error ? <p className="mt-3 text-sm text-[#C46A5E]">{error}</p> : null}
      </section>
    </main>
  );
}
