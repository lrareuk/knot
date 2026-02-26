import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader, { type SiteNavItem } from "@/app/components/SiteHeader";
import { LEGAL_DOCUMENTS } from "@/app/legal/content";
import { LEGAL_DOC_KEYS, type LegalDocKey, resolveLegalDocKey } from "@/app/legal/model";
import styles from "./LegalPage.module.css";

const LEGAL_NAV_ITEMS: SiteNavItem[] = [
  { href: "/", label: "Home" },
  { href: "/legal?doc=privacy", label: "Legal" },
];

export const metadata: Metadata = {
  title: "Untie — Legal",
  description: "Privacy Policy and Terms of Service for Untie.",
};

function buildLegalHref(doc: LegalDocKey) {
  return `/legal?doc=${doc}`;
}

export default async function LegalPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const activeDoc = resolveLegalDocKey(params.doc);
  const activeDocument = LEGAL_DOCUMENTS[activeDoc];

  return (
    <main className={styles.root}>
      <SiteHeader navItems={LEGAL_NAV_ITEMS} ctaHref="/start" ctaLabel="Get started" />

      <div className={styles.page}>
        <nav className={styles.tabBar} aria-label="Legal documents">
          {LEGAL_DOC_KEYS.map((doc) => {
            const isActive = activeDoc === doc;

            return (
              <Link
                key={doc}
                href={buildLegalHref(doc)}
                className={`${styles.tab} ${isActive ? styles.tabActive : ""}`.trim()}
                aria-current={isActive ? "page" : undefined}
              >
                {LEGAL_DOCUMENTS[doc].tabLabel}
              </Link>
            );
          })}
        </nav>

        <article className={styles.doc} id={`doc-${activeDoc}`}>
          <header className={styles.docHeader}>
            <h1 className={styles.docTitle}>{activeDocument.title}</h1>
            <p className={styles.docMeta}>
              Effective: {activeDocument.effectiveDate} · Last updated: {activeDocument.lastUpdated}
            </p>
          </header>

          {activeDocument.content}
        </article>
      </div>

      <div className={styles.footerWrap}>
        <SiteFooter />
      </div>
    </main>
  );
}
