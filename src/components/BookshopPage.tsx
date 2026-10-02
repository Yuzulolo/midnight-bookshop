import Link from "next/link";
import type { ReactNode } from "react";

export function BookshopPage({
  title,
  eyebrow,
  children,
  compact = false,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <main
      className={`bookshop-page ${compact ? "bookshop-page--compact" : ""}`}
    >
      <div className="paper-grain" aria-hidden="true" />
      <header className="bookshop-page-header">
        <Link href="/" className="library-brand" aria-label="Bookit home">
          BOOKIT<span>──── ✥ ────</span>
        </Link>
        <Link href="/" className="bookshop-back">
          ← Back to the bookshop
        </Link>
      </header>
      <section
        className="bookshop-page-card"
        aria-labelledby="bookshop-page-title"
      >
        <p className="eyebrow">{eyebrow}</p>
        <span className="bookshop-page-moon" aria-hidden="true">
          ☾
        </span>
        <h1 id="bookshop-page-title">{title}</h1>
        {children}
      </section>
      <footer className="bookshop-page-footer">
        <span>✥</span> The Midnight Bookshop
      </footer>
    </main>
  );
}
