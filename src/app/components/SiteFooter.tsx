import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <span className="logo-wordmark footer-logo-image" aria-hidden />
        <span className="sr-only">Untie</span>
        <div className="footer-tagline">Clarity before change.</div>
      </div>
      <ul className="footer-links">
        <li>
          <Link href="/legal?doc=privacy">Privacy</Link>
        </li>
        <li>
          <Link href="/legal?doc=terms">Terms</Link>
        </li>
        <li>
          <a href="mailto:legal@untie.lrare.co.uk">Contact</a>
        </li>
      </ul>
    </footer>
  );
}
