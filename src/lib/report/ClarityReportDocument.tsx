import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ScenarioRecord, ScenarioResults } from "@/lib/domain/types";
import type { JurisdictionProfile } from "@/lib/legal/jurisdictions";
import type { AgreementInterpretationWarning } from "@/lib/legal/types";

type Props = {
  generatedAt: string;
  baseline: ScenarioResults;
  scenarios: ScenarioRecord[];
  observations: Record<string, string[]>;
  agreementInterpretations: Record<string, AgreementInterpretationWarning[]>;
  jurisdictionProfile: JurisdictionProfile | null;
  currencyCode: "GBP" | "USD" | "CAD";
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FFFFFF",
    color: "#1F1F1F",
    fontSize: 10,
    paddingBottom: 28,
  },
  headerBar: {
    backgroundColor: "#121212",
    color: "#F4F1EA",
    paddingHorizontal: 24,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  wordmark: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 3,
  },
  pageNo: {
    fontSize: 9,
    opacity: 0.8,
  },
  body: {
    paddingHorizontal: 24,
  },
  heading: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 12,
    color: "#555555",
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: "#DADADA",
    marginBottom: 14,
    padding: 10,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 8,
    color: "#C2185B",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#DADADA",
    paddingBottom: 5,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
    paddingVertical: 3,
  },
  tableLabel: {
    flex: 2,
    color: "#555555",
  },
  tableCell: {
    flex: 1,
    textAlign: "right",
  },
  deltaNeg: {
    color: "#C2185B",
  },
  deltaPos: {
    color: "#2E7D52",
  },
  listItem: {
    marginBottom: 4,
    lineHeight: 1.45,
  },
  disclaimer: {
    marginTop: 12,
    fontSize: 9,
    color: "#555555",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
});

function money(value: number, currencyCode: "GBP" | "USD" | "CAD") {
  const locale = currencyCode === "USD" ? "en-US" : currencyCode === "CAD" ? "en-CA" : "en-GB";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(value);
}

function delta(value: number, currencyCode: "GBP" | "USD" | "CAD") {
  if (value === 0) return "—";
  return `${value > 0 ? "+" : "−"}${money(Math.abs(value), currencyCode)}`;
}

function percentage(value: number | null) {
  if (value === null) {
    return "—";
  }

  return `${Math.round(value * 100)}%`;
}

function fairnessReasonLabel(reason: string) {
  switch (reason) {
    case "defined_benefit_present":
      return "Defined benefit pension present";
    case "missing_income_projection":
      return "Missing pension income projection";
    case "large_offsetting_tradeoff":
      return "Large house-for-pension trade-off";
    case "large_retirement_income_gap":
      return "Large retirement income gap";
    default:
      return reason;
  }
}

function PageHeader() {
  return (
    <View style={styles.headerBar} fixed>
      <Text style={styles.wordmark}>UNTIE</Text>
      <Text style={styles.pageNo} render={({ pageNumber }) => `Page ${pageNumber}`} />
    </View>
  );
}

function SummaryRows({
  results,
  currencyCode,
  jurisdictionCode,
}: {
  results: ScenarioResults;
  currencyCode: "GBP" | "USD" | "CAD";
  jurisdictionCode: string | null | undefined;
}) {
  const normalizedJurisdictionCode = (jurisdictionCode ?? "").trim().toUpperCase();
  const pensionLabel = normalizedJurisdictionCode === "GB-EAW" ? "Projected pension income (annual)" : "Pensions";
  const pensionValue = normalizedJurisdictionCode === "GB-EAW" ? results.user_pension_income_annual : results.user_total_pensions;

  return (
    <View>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>Net position (user)</Text>
        <Text style={styles.tableCell}>{money(results.user_net_position, currencyCode)}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>Property equity</Text>
        <Text style={styles.tableCell}>{money(results.user_property_equity, currencyCode)}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>{pensionLabel}</Text>
        <Text style={styles.tableCell}>{money(pensionValue, currencyCode)}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>Savings</Text>
        <Text style={styles.tableCell}>{money(results.user_total_savings, currencyCode)}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>Debts</Text>
        <Text style={styles.tableCell}>{money(results.user_total_debts, currencyCode)}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>Monthly surplus/deficit</Text>
        <Text style={styles.tableCell}>{money(results.user_monthly_surplus_deficit, currencyCode)}</Text>
      </View>
    </View>
  );
}

export function ClarityReportDocument({
  generatedAt,
  baseline,
  scenarios,
  observations,
  agreementInterpretations,
  jurisdictionProfile,
  currencyCode,
}: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PageHeader />
        <View style={styles.body}>
          <Text style={styles.heading}>UNTIE Clarity Report</Text>
          <Text style={styles.subheading}>Generated on {generatedAt}</Text>

          <View style={styles.card}>
            <Text style={styles.cardHeader}>Cover</Text>
            <Text style={styles.listItem}>
              This document is a modelling output to support financial clarity and planning conversations.
            </Text>
            <Text style={styles.listItem}>It is not legal or financial advice and does not predict court outcomes.</Text>
          </View>

          <Text style={styles.disclaimer}>
            This report provides scenario modelling only. Consult a solicitor for advice specific to your circumstances.
          </Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <PageHeader />
        <View style={styles.body}>
          <Text style={styles.sectionHeading}>Section 1: Baseline financial position</Text>
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Current position</Text>
            <SummaryRows
              results={baseline}
              currencyCode={currencyCode}
              jurisdictionCode={jurisdictionProfile?.code ?? null}
            />
          </View>
        </View>
      </Page>

      {scenarios.map((scenario) => (
        <Page key={scenario.id} size="A4" style={styles.page}>
          <PageHeader />
          <View style={styles.body}>
            <Text style={styles.sectionHeading}>Section 2: {scenario.name}</Text>
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Scenario configuration outcome</Text>
              <SummaryRows
                results={scenario.results}
                currencyCode={currencyCode}
                jurisdictionCode={jurisdictionProfile?.code ?? null}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeader}>Change from baseline</Text>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Net position delta</Text>
                <Text style={[styles.tableCell, scenario.results.delta_user_net_position < 0 ? styles.deltaNeg : styles.deltaPos]}>
                  {delta(scenario.results.delta_user_net_position, currencyCode)}
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Monthly delta</Text>
                <Text style={[styles.tableCell, scenario.results.delta_user_monthly < 0 ? styles.deltaNeg : styles.deltaPos]}>
                  {delta(scenario.results.delta_user_monthly, currencyCode)}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeader}>Pension fairness and offsetting checks</Text>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Offsetting trade-off detected</Text>
                <Text style={styles.tableCell}>{scenario.results.offsetting_tradeoff_detected ? "Yes" : "No"}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Offsetting trade-off strength</Text>
                <Text style={styles.tableCell}>{scenario.results.offsetting_tradeoff_strength}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Retirement income gap (annual)</Text>
                <Text style={styles.tableCell}>{money(scenario.results.retirement_income_gap_annual, currencyCode)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Retirement income parity</Text>
                <Text style={styles.tableCell}>{percentage(scenario.results.retirement_income_parity_ratio)}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Specialist pension advice recommended</Text>
                <Text style={styles.tableCell}>{scenario.results.specialist_advice_recommended ? "Yes" : "No"}</Text>
              </View>
              {scenario.results.specialist_advice_reasons.map((reason) => (
                <Text key={reason} style={styles.listItem}>
                  • {fairnessReasonLabel(reason)}
                </Text>
              ))}
              <Text style={styles.disclaimer}>
                Pension offsetting checks are modelling support only. They do not replace legal or actuarial advice.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeader}>Agreement interpretation</Text>
              {(agreementInterpretations[scenario.id] ?? []).length === 0 ? (
                <Text style={styles.listItem}>No agreement conflicts detected for this scenario.</Text>
              ) : (
                (agreementInterpretations[scenario.id] ?? []).map((warning) => (
                  <Text key={warning.key} style={styles.listItem}>
                    • [{warning.severity.toUpperCase()}] {warning.message} Citation: &quot;{warning.citation.quote}&quot;
                  </Text>
                ))
              )}
            </View>
          </View>
        </Page>
      ))}

      <Page size="A4" style={styles.page}>
        <PageHeader />
        <View style={styles.body}>
          <Text style={styles.sectionHeading}>Section 3: Side-by-side comparison</Text>
          <View style={styles.card}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableLabel}>Metric</Text>
              <Text style={styles.tableCell}>Baseline</Text>
              {scenarios.map((scenario) => (
                <Text key={scenario.id} style={styles.tableCell}>
                  {scenario.name}
                </Text>
              ))}
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Net position (user)</Text>
              <Text style={styles.tableCell}>{money(baseline.user_net_position, currencyCode)}</Text>
              {scenarios.map((scenario) => (
                <Text key={scenario.id} style={styles.tableCell}>
                  {money(scenario.results.user_net_position, currencyCode)}
                </Text>
              ))}
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Monthly surplus/deficit</Text>
              <Text style={styles.tableCell}>{money(baseline.user_monthly_surplus_deficit, currencyCode)}</Text>
              {scenarios.map((scenario) => (
                <Text key={scenario.id} style={styles.tableCell}>
                  {money(scenario.results.user_monthly_surplus_deficit, currencyCode)}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <PageHeader />
        <View style={styles.body}>
          <Text style={styles.sectionHeading}>Section 4: Auto-generated observations</Text>
          {scenarios.map((scenario) => (
            <View key={scenario.id} style={styles.card}>
              <Text style={styles.cardHeader}>{scenario.name}</Text>
              {observations[scenario.id]?.map((line) => (
                <Text key={line} style={styles.listItem}>
                  • {line}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <PageHeader />
        <View style={styles.body}>
          <Text style={styles.sectionHeading}>Final page: Disclaimers and next steps</Text>
          {jurisdictionProfile ? (
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Jurisdiction profile</Text>
              <Text style={styles.listItem}>{jurisdictionProfile.display_name}</Text>
              <Text style={styles.listItem}>{jurisdictionProfile.property_framework}</Text>
              <Text style={styles.listItem}>{jurisdictionProfile.maintenance_framework}</Text>
              {jurisdictionProfile.key_caveats.map((caveat) => (
                <Text key={caveat} style={styles.listItem}>
                  • {caveat}
                </Text>
              ))}
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.listItem}>
              Untie provides financial modelling only. It does not provide legal entitlement calculations, court predictions, tax
              advice, or investment advice.
            </Text>
            <Text style={styles.listItem}>
              Use this report to structure professional discussions with a solicitor and other relevant advisers.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
