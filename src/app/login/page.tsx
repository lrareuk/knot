import AuthForm from "@/app/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <main className="page-shell auth-shell">
      <AuthForm mode="sign-in" />
    </main>
  );
}
