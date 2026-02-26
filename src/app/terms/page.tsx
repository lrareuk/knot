import Image from "next/image";
import Link from "next/link";
import Reveal from "@/app/components/Reveal";
import ThemeToggle from "@/app/components/ThemeToggle";

export default function TermsPage() {
  return (
    <main className="site-shell min-h-screen bg-background text-text">
      <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 md:px-8 md:pt-8">
        <header className="flex items-center justify-between rounded-2xl border border-divider bg-[var(--surface-glass)] px-4 py-3 backdrop-blur-xl">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/untie-logo.svg"
              alt="Untie"
              width={132}
              height={40}
              className="logo-wordmark h-6 w-auto"
            />
          </Link>
          <ThemeToggle />
        </header>

        <Reveal className="reveal-1">
          <section className="card card-soft mt-8 p-7 md:p-10">
            <h1 className="font-heading text-4xl font-semibold tracking-[-0.02em] md:text-5xl">Terms</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
              Full terms are coming soon. Untie provides simplified financial modelling and does not
              provide legal advice or professional representation.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-button-text transition-colors hover:bg-accent-strong"
            >
              Back to home
            </Link>
          </section>
        </Reveal>
      </div>
    </main>
  );
}
