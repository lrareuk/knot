import { redirect } from "next/navigation";
import PanicRecoveryAdminForm from "@/app/components/admin/PanicRecoveryAdminForm";
import { requireAuthContext } from "@/lib/server/auth";
import { isRecoveryAdminEmail } from "@/lib/server/admin-recovery";

export default async function AdminRecoveryPage() {
  const { user } = await requireAuthContext();
  const userEmail = user.email?.trim().toLowerCase();

  if (!userEmail || !isRecoveryAdminEmail(userEmail)) {
    redirect("/dashboard");
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f8fafc", padding: "1rem" }}>
      <PanicRecoveryAdminForm adminEmail={userEmail} />
    </main>
  );
}
