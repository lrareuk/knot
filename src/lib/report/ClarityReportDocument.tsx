import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ScenarioRecord, ScenarioResults } from "@/lib/domain/types";

type Props = {
  generatedAt: string;
  baseline: ScenarioResults;
  scenarios: ScenarioRecord[];
  observations: Record<string, string[]>;
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

function money(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function delta(value: number) {
  if (value === 0) return "—";
  return `${value > 0 ? "+" : "−"}${money(Math.abs(value))}`;
}

function PageHeader() {
  return (
    <View style={styles.headerBar} fixed>
      <Text style={styles.wordmark}>UNTIE</Text>
      <Text style={styles.pageNo} render={({ pageNumber }) => `Page ${pageNumber}`} />
    </View>
  );
}

function SummaryRows({ results }: { results: ScenarioResults }) {
  return (
    <View>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>Net position (user)</Text>
        <Text style={styles.tableCell}>{money(results.user_net_position)}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>Property equity</Text>
        <Text style={styles.tableCell}>{money(results.user_property_equity)}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>Pensions</Text>
        <Text style={styles.tableCell}>{money(results.user_total_pensions)}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>Savings</Text>
        <Text style={styles.tableCell}>{money(results.user_total_savings)}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>Debts</Text>
        <Text style={styles.tableCell}>{money(results.user_total_debts)}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.tableLabel}>Monthly surplus/deficit</Text>
        <Text style={styles.tableCell}>{money(results.user_monthly_surplus_deficit)}</Text>
      </View>
    </View>
  );
}

export function ClarityReportDocument({ generatedAt, baseline, scenarios, observations }: Props) {
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
            <SummaryRows results={baseline} />
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
              <SummaryRows results={scenario.results} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeader}>Change from baseline</Text>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Net position delta</Text>
                <Text style={[styles.tableCell, scenario.results.delta_user_net_position < 0 ? styles.deltaNeg : styles.deltaPos]}>
                  {delta(scenario.results.delta_user_net_position)}
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Monthly delta</Text>
                <Text style={[styles.tableCell, scenario.results.delta_user_monthly < 0 ? styles.deltaNeg : styles.deltaPos]}>
                  {delta(scenario.results.delta_user_monthly)}
                </Text>
              </View>
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
              <Text style={styles.tableCell}>{money(baseline.user_net_position)}</Text>
              {scenarios.map((scenario) => (
                <Text key={scenario.id} style={styles.tableCell}>
                  {money(scenario.results.user_net_position)}
                </Text>
              ))}
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Monthly surplus/deficit</Text>
              <Text style={styles.tableCell}>{money(baseline.user_monthly_surplus_deficit)}</Text>
              {scenarios.map((scenario) => (
                <Text key={scenario.id} style={styles.tableCell}>
                  {money(scenario.results.user_monthly_surplus_deficit)}
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
