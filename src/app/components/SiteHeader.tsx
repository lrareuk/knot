import Link from "next/link";

export type SiteNavItem = {
  href: string;
  label: string;
};

export const HOME_NAV_ITEMS: SiteNavItem[] = [
  { href: "#how", label: "How it works" },
  { href: "#clarity", label: "Clarity" },
  { href: "#trust", label: "Trust" },
  { href: "#pricing", label: "Pricing" },
];

export const SITE_NAV_ITEMS: SiteNavItem[] = [
  { href: "/#how", label: "How it works" },
  { href: "/#clarity", label: "Clarity" },
  { href: "/#trust", label: "Trust" },
  { href: "/#pricing", label: "Pricing" },
];

type SiteHeaderProps = {
  navItems?: SiteNavItem[];
  ctaHref?: string;
  ctaLabel?: string;
};

function HeaderLink({ item }: { item: SiteNavItem }) {
  if (item.href.startsWith("#")) {
    return <a href={item.href}>{item.label}</a>;
  }

  return <Link href={item.href}>{item.label}</Link>;
}

export default function SiteHeader({
  navItems = SITE_NAV_ITEMS,
  ctaHref = "/start",
  ctaLabel = "Get started",
}: SiteHeaderProps) {
  const ctaIsAnchor = ctaHref.startsWith("#");

  return (
    <nav className="site-nav">
      <Link href="/" className="nav-logo-link" aria-label="Untie home">
        <span className="logo-wordmark nav-logo-image" aria-hidden="true" />
        <span className="sr-only">Untie</span>
      </Link>

      <ul className="nav-links">
        {navItems.map((item) => (
          <li key={`${item.label}-${item.href}`}>
            <HeaderLink item={item} />
          </li>
        ))}
      </ul>

      {ctaIsAnchor ? (
        <a href={ctaHref} className="nav-cta">
          {ctaLabel}
        </a>
      ) : (
        <Link href={ctaHref} className="nav-cta">
          {ctaLabel}
        </Link>
      )}
    </nav>
  );
}
