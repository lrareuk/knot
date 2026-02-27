import type { ScenarioResults } from "@/lib/domain/types";

function currency(value: number, currencyCode: "GBP" | "USD" | "CAD") {
  const locale = currencyCode === "USD" ? "en-US" : currencyCode === "CAD" ? "en-CA" : "en-GB";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}

export function generateScenarioObservations(
  name: string,
  results: ScenarioResults,
  currencyCode: "GBP" | "USD" | "CAD" = "GBP"
): string[] {
  const lines: string[] = [];

  if (results.user_monthly_surplus_deficit < 0) {
    lines.push(
      `In ${name}, your monthly expenditure exceeds income by ${currency(Math.abs(results.user_monthly_surplus_deficit), currencyCode)}. This model would require either increased income or reduced spending.`
    );
  } else if (results.user_monthly_surplus_deficit > 0) {
    lines.push(
      `In ${name}, your modelled monthly surplus is ${currency(results.user_monthly_surplus_deficit, currencyCode)}, which can be used for resilience or debt reduction.`
    );
  }

  if (results.delta_user_net_position < 0) {
    lines.push(
      `Compared with baseline, your modelled net position falls by ${currency(Math.abs(results.delta_user_net_position), currencyCode)}.`
    );
  } else if (results.delta_user_net_position > 0) {
    lines.push(`Compared with baseline, your modelled net position increases by ${currency(results.delta_user_net_position, currencyCode)}.`);
  }

  if (results.user_maintenance_paid > 0) {
    lines.push(
      `This scenario includes ${currency(results.user_maintenance_paid, currencyCode)} monthly maintenance paid by you (illustrative only).`
    );
  }

  if (results.user_maintenance_received > 0) {
    lines.push(
      `This scenario includes ${currency(results.user_maintenance_received, currencyCode)} monthly maintenance received by you (illustrative only).`
    );
  }

  if (lines.length === 0) {
    lines.push(`In ${name}, your modelled position is close to baseline with limited month-to-month variation.`);
  }

  return lines;
}
