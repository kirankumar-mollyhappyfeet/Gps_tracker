'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/tech', label: 'Technician' },
  { href: '/admin', label: 'Admin GPS' },
];

export function AppNav() {
  const path = usePathname();
  return (
    <header className="border-b border-[var(--line)] bg-[var(--panel)]/80 backdrop-blur">
      <div className="shell flex flex-wrap items-center justify-between gap-4 py-4">
        <div>
          <p className="font-display text-xl tracking-tight">Knopvvs</p>
          <p className="text-xs text-[var(--muted)]">
            GPS tracking · Time tracking
          </p>
        </div>
        <nav className="flex gap-1">
          {links.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-2 text-sm ${
                  active
                    ? 'bg-[var(--ink)] text-white'
                    : 'text-[var(--muted)] hover:bg-black/5'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
