import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <div className="footer-logo">Untie</div>
        <div className="footer-tagline">Clarity before change.</div>
      </div>
      <ul className="footer-links">
        <li>
          <Link href="/privacy">Privacy</Link>
        </li>
        <li>
          <Link href="/terms">Terms</Link>
        </li>
        <li>
          <a href="mailto:hello@untie.app">Contact</a>
        </li>
      </ul>
    </footer>
  );
}
