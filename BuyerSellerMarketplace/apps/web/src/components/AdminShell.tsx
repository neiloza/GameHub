'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SECTIONS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/applications', label: 'Applications' },
  { href: '/admin/users', label: 'Accounts' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/ads', label: 'Advertising' },
  { href: '/admin/promoters', label: 'Promoters' },
  { href: '/admin/billing', label: 'Billing' },
  { href: '/admin/feedback', label: 'Feedback' },
  { href: '/admin/audit', label: 'Audit log' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Administration</h1>

      <nav className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="Admin sections">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            aria-current={pathname === s.href ? 'page' : undefined}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
              pathname === s.href
                ? 'bg-ink text-white'
                : 'border border-slate-300 text-slate-600 hover:bg-surface'
            }`}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
