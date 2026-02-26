import { redirect } from "next/navigation";
import AccountDeletionForm from "@/app/components/settings/AccountDeletionForm";
import { requireAuthContext } from "@/lib/server/auth";

export default async function SettingsPage() {
  const { user } = await requireAuthContext();
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="page-shell narrow stack-lg">
      <section className="panel stack-sm">
        <h1>Settings</h1>
        <p className="muted">Manage your account and data controls.</p>
      </section>

      <AccountDeletionForm />
    </main>
  );
}
