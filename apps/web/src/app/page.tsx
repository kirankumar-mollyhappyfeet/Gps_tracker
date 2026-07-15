import Link from 'next/link';
import { AppNav } from '@/components/AppNav';

export default function Home() {
  return (
    <div>
      <AppNav />
      <main className="shell grid min-h-[70vh] items-center gap-10 lg:grid-cols-2">
        <div className="space-y-5">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
            Field operations
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Vehicle GPS &amp; time tracking
          </h1>
          <p className="max-w-md text-lg text-[var(--muted)]">
            Automatic arrive/leave from the van tracker. Technicians approve
            suggested time — or split it when several orders share one building.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/tech" className="btn btn-primary px-5 py-3">
              Open technician
            </Link>
            <Link href="/admin" className="btn btn-ghost px-5 py-3">
              Open admin GPS
            </Link>
          </div>
        </div>
        <div className="card space-y-4 p-6">
          <h2 className="font-display text-xl">How to test</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--muted)]">
            <li>
              API running on <code className="text-[var(--ink)]">:3001</code>
            </li>
            <li>
              <code className="text-[var(--ink)]">
                cd apps/api && npx prisma db seed
              </code>
            </li>
            <li>
              <code className="text-[var(--ink)]">
                node scripts/simulate-gps-day.js
              </code>
            </li>
            <li>
              Tech: one-click approve Hansen · split Acme building times
            </li>
            <li>Admin: review Home → Traveled → Stationary blocks</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
