import AuthForm from "@/app/components/auth/AuthForm";

export default function SignupPage() {
  return (
    <main className="page-shell auth-shell">
      <AuthForm mode="sign-up" />
    </main>
  );
}
