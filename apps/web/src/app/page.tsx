import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Knopvvs GPS Time Tracking
      </h1>
      <p className="text-slate-600">
        Vehicle GPS site visits with multi-order time allocation.
      </p>
      <div className="flex gap-4">
        <Link
          href="/tech"
          className="rounded bg-slate-900 px-4 py-2 text-white"
        >
          Technician
        </Link>
        <Link
          href="/admin"
          className="rounded border border-slate-900 px-4 py-2"
        >
          Admin
        </Link>
      </div>
    </main>
  );
}
