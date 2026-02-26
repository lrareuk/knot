import type { ScenarioResults } from "@/lib/domain/types";

function currency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function generateScenarioObservations(name: string, results: ScenarioResults): string[] {
  const lines: string[] = [];

  if (results.user_monthly_surplus_deficit < 0) {
    lines.push(
      `In ${name}, your monthly expenditure exceeds income by ${currency(
        Math.abs(results.user_monthly_surplus_deficit)
      )}. This model would require either increased income or reduced spending.`
    );
  } else if (results.user_monthly_surplus_deficit > 0) {
    lines.push(
      `In ${name}, your modelled monthly surplus is ${currency(
        results.user_monthly_surplus_deficit
      )}, which can be used for resilience or debt reduction.`
    );
  }

  if (results.delta_user_net_position < 0) {
    lines.push(
      `Compared with baseline, your modelled net position falls by ${currency(
        Math.abs(results.delta_user_net_position)
      )}.`
    );
  } else if (results.delta_user_net_position > 0) {
    lines.push(`Compared with baseline, your modelled net position increases by ${currency(results.delta_user_net_position)}.`);
  }

  if (results.user_maintenance_paid > 0) {
    lines.push(
      `This scenario includes ${currency(results.user_maintenance_paid)} monthly maintenance paid by you (illustrative only).`
    );
  }

  if (results.user_maintenance_received > 0) {
    lines.push(
      `This scenario includes ${currency(
        results.user_maintenance_received
      )} monthly maintenance received by you (illustrative only).`
    );
  }

  if (lines.length === 0) {
    lines.push(`In ${name}, your modelled position is close to baseline with limited month-to-month variation.`);
  }

  return lines;
}
