import AuthFlowShell from "@/app/components/auth/AuthFlowShell";
import SignupNameStep from "@/app/components/auth/SignupNameStep";

export default function SignupPage() {
  return (
    <AuthFlowShell>
      <SignupNameStep />
    </AuthFlowShell>
  );
}
