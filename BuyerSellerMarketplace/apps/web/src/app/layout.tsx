import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AutoUpdater } from '@/components/AutoUpdater';
import { BuildStamp } from '@/components/BuildStamp';
import { FeedbackButton } from '@/components/FeedbackButton';
import { Nav } from '@/components/Nav';
import { SelectionBoundary } from '@/components/SelectionBoundary';
import './globals.css';

// Cloudflare Pages (@cloudflare/next-on-pages) runs server rendering on the
// Workers edge runtime. Declaring it in the root layout cascades to every page
// segment — including 'use client' pages, which cannot carry the export
// themselves. Route handlers do not inherit from layouts, so each route.ts sets
// its own runtime.
export const runtime = 'edge';

// next/font self-hosts the files at build time — no CDN request at runtime, no
// layout shift while a webfont loads — and hands back a CSS variable that
// globals.css feeds into Tailwind's --font-sans.
const display = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Marketplace',
    template: '%s · Marketplace',
  },
  description:
    'Sellers list what they have. Approved buyers browse and reach out. Conversations open only when both sides agree.',
  appleWebApp: {
    capable: true,
    title: 'Marketplace',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b1d35',
  // `viewportFit: cover` is what lets the safe-area padding in globals.css
  // actually do anything on a notched phone.
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={display.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        {/* Renders nothing. Reloads the page when a new build goes live, so a
            home-screen PWA resuming an old session does not run stale code. */}
        <AutoUpdater />
        {/* Renders nothing. Confines a highlight to the card, cell or dialog it
            started in, so a stray drag cannot sweep up the whole page. */}
        <SelectionBoundary />

        {/* Keyboard and screen-reader users land here first. Visually hidden
            until focused, which is the only time it is useful. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>

        <Nav />

        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
          {children}
        </main>

        <FeedbackButton />

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-slate-500 sm:px-6">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>© {new Date().getFullYear()} Marketplace</span>
              <a className="hover:text-brand-dark" href="/privacy">
                Privacy
              </a>
              <a className="hover:text-brand-dark" href="/terms">
                Terms
              </a>
            </p>
            <BuildStamp />
          </div>
        </footer>
      </body>
    </html>
  );
}
