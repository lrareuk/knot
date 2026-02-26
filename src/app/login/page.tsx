import { Suspense } from "react";
import AuthFlowShell from "@/app/components/auth/AuthFlowShell";
import LoginStep from "@/app/components/auth/LoginStep";

export default function LoginPage() {
  return (
    <AuthFlowShell>
      <Suspense fallback={null}>
        <LoginStep />
      </Suspense>
    </AuthFlowShell>
  );
}
