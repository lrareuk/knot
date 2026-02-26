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
    backgroundColor: "#121212",
    color: "#F4F1EA",
    padding: 32,
    fontSize: 10,
    lineHeight: 1.4,
  },
  heading: {
    fontSize: 18,
    marginBottom: 10,
  },
  subheading: {
    fontSize: 12,
    color: "#C2185B",
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: "#2A2A2A",
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#1E1E1E",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
    marginBottom: 6,
    paddingBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  cellLabel: {
    flex: 2,
    color: "#9A9590",
  },
  cellValue: {
    flex: 1,
    textAlign: "right",
  },
  disclaimer: {
    marginTop: 16,
    color: "#9A9590",
  },
});

function money(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function SummaryRows({ title, results }: { title: string; results: ScenarioResults }) {
  return (
    <View style={styles.card}>
      <Text style={styles.subheading}>{title}</Text>
      <View style={styles.tableRow}>
        <Text style={styles.cellLabel}>Net asset position (user)</Text>
        <Text style={styles.cellValue}>{money(results.user_net_position)}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.cellLabel}>Property equity (user)</Text>
        <Text style={styles.cellValue}>{money(results.user_property_equity)}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.cellLabel}>Pensions (user)</Text>
        <Text style={styles.cellValue}>{money(results.user_total_pensions)}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.cellLabel}>Savings (user)</Text>
        <Text style={styles.cellValue}>{money(results.user_total_savings)}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.cellLabel}>Debts (user)</Text>
        <Text style={styles.cellValue}>{money(results.user_total_debts)}</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={styles.cellLabel}>Monthly surplus/deficit (user)</Text>
        <Text style={styles.cellValue}>{money(results.user_monthly_surplus_deficit)}</Text>
      </View>
    </View>
  );
}

export function ClarityReportDocument({ generatedAt, baseline, scenarios, observations }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>UNTIE Clarity Report</Text>
        <Text>Generated on {generatedAt}</Text>
        <Text style={styles.disclaimer}>This report is not legal or financial advice.</Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>Section 1: Baseline financial position</Text>
        <SummaryRows title="Current combined baseline" results={baseline} />
        <Text style={styles.disclaimer}>
          This is a modelled baseline for planning. It is not a legal entitlement or court outcome.
        </Text>
      </Page>

      {scenarios.map((scenario) => (
        <Page key={scenario.id} size="A4" style={styles.page}>
          <Text style={styles.heading}>Section 2: {scenario.name}</Text>
          <SummaryRows title="Scenario result" results={scenario.results} />
          <Text style={styles.disclaimer}>
            Child maintenance and aliment figures are illustrative estimates. Tax and pension order implications are not included.
          </Text>
        </Page>
      ))}

      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>Section 3: Comparison table</Text>
        <View style={styles.card}>
          <View style={styles.tableHeader}>
            <Text style={styles.cellLabel}>Metric</Text>
            <Text style={styles.cellValue}>Baseline</Text>
            {scenarios.map((scenario) => (
              <Text key={scenario.id} style={styles.cellValue}>
                {scenario.name}
              </Text>
            ))}
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cellLabel}>Net position (user)</Text>
            <Text style={styles.cellValue}>{money(baseline.user_net_position)}</Text>
            {scenarios.map((scenario) => (
              <Text key={scenario.id} style={styles.cellValue}>
                {money(scenario.results.user_net_position)}
              </Text>
            ))}
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cellLabel}>Monthly surplus/deficit (user)</Text>
            <Text style={styles.cellValue}>{money(baseline.user_monthly_surplus_deficit)}</Text>
            {scenarios.map((scenario) => (
              <Text key={scenario.id} style={styles.cellValue}>
                {money(scenario.results.user_monthly_surplus_deficit)}
              </Text>
            ))}
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>Section 4: Key observations</Text>
        {scenarios.map((scenario) => (
          <View key={scenario.id} style={styles.card}>
            <Text style={styles.subheading}>{scenario.name}</Text>
            {observations[scenario.id]?.map((line) => (
              <Text key={line} style={{ marginBottom: 4 }}>
                • {line}
              </Text>
            ))}
          </View>
        ))}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>Final page: Disclaimers and next steps</Text>
        <Text style={styles.disclaimer}>
          Untie provides financial modelling only. It does not provide legal entitlement calculations, court predictions, tax advice, or financial advice.
        </Text>
        <Text style={styles.disclaimer}>
          Consider taking this report into a professional legal discussion where appropriate.
        </Text>
      </Page>
    </Document>
  );
}
