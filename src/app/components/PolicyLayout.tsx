import type { AccordionItem } from "@/app/components/PolicyAccordion";
import PolicyAccordion from "@/app/components/PolicyAccordion";
import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader, { SITE_NAV_ITEMS } from "@/app/components/SiteHeader";

export type PolicyMetaItem = {
  label: string;
  value: string;
};

type PolicyLayoutProps = {
  eyebrow: string;
  title: string;
  lede: string;
  meta: PolicyMetaItem[];
  tocAriaLabel: string;
  sections: AccordionItem[];
  defaultOpenId: string;
};

export default function PolicyLayout({
  eyebrow,
  title,
  lede,
  meta,
  tocAriaLabel,
  sections,
  defaultOpenId,
}: PolicyLayoutProps) {
  return (
    <main className="policy-page">
      <SiteHeader navItems={SITE_NAV_ITEMS} ctaHref="/start" ctaLabel="Get started" />

      <div className="policy-shell policy-hero">
        <p className="section-label">{eyebrow}</p>
        <h1 className="section-heading">{title}</h1>
        <p className="policy-lede">{lede}</p>
        <div className="policy-meta-grid" aria-label={`${title} metadata`}>
          {meta.map((item, index) => (
            <p key={`${item.label}-${index}`} className="policy-meta-pill">
              <span>{item.label}</span>
              {item.value}
            </p>
          ))}
        </div>
      </div>

      <div className="divider" />

      <div className="policy-shell policy-content-wrap">
        <aside className="policy-toc" aria-label={tocAriaLabel}>
          <p className="policy-toc-title">Browse Sections</p>
          <ol>
            {sections.map((section, index) => (
              <li key={`${section.id}-${index}`}>
                <a href={`#${section.id}`}>{section.title}</a>
              </li>
            ))}
          </ol>
        </aside>

        <article className="policy-card">
          <PolicyAccordion items={sections} defaultOpenId={defaultOpenId} level={1} />
        </article>
      </div>

      <div className="divider" />
      <SiteFooter />
    </main>
  );
}
