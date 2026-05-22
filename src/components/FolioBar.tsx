'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FolioBar() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isHow = pathname === '/how-it-works';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-solid" style={{ borderColor: 'var(--rule)', backgroundColor: 'var(--parchment)' }}>
      <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3 sm:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-baseline gap-2 no-underline">
          <span
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-lora)', color: 'var(--accent)', letterSpacing: '-0.01em' }}
          >
            Meeting Notes
          </span>
          <span className="folio hidden sm:inline">Portfolio #6 · Tai Huynh</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-5">
          <Link
            href="/"
            className={`nav-link ${isHome ? 'nav-link-active' : ''}`}
          >
            Demo
          </Link>
          <Link
            href="/how-it-works"
            className={`nav-link ${isHow ? 'nav-link-active' : ''}`}
          >
            How it works
          </Link>
          <a
            href="mailto:huynhchitai.070306@gmail.com?subject=Freelance%20enquiry%20%E2%80%94%20Meeting%20Notes"
            className="nav-link hidden sm:inline"
          >
            Hire me
          </a>
        </nav>
      </div>
    </header>
  );
}
