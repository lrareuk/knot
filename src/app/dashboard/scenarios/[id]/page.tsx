import { redirect } from "next/navigation";

export default async function LegacyScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard/scenario/${id}`);
}
