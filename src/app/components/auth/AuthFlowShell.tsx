import Link from "next/link";
import { ReactNode } from "react";
import styles from "./AuthFlow.module.css";

type Props = {
  children: ReactNode;
};

export default function AuthFlowShell({ children }: Props) {
  return (
    <main className={styles.page}>
      <header className={styles.headerBar}>
        <Link href="/" className={styles.logoLink} aria-label="Untie home">
          <span className="logo-wordmark nav-logo-image" aria-hidden />
          <span className="sr-only">Untie</span>
        </Link>
      </header>
      <div className={styles.thread} aria-hidden />
      <section className={styles.viewport}>
        <div className={styles.contentWrap}>{children}</div>
      </section>
    </main>
  );
}
