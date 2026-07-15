'use client';

type Live = {
  lastPing: { lat: number; lng: number; recordedAt: string } | null;
  openBlock: { type: string; status: string } | null;
};

export function LiveMap({ live }: { live: Live | null }) {
  if (!live?.lastPing) {
    return <p className="text-sm text-slate-500">No live ping yet.</p>;
  }
  const { lat, lng, recordedAt } = live.lastPing;
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  return (
    <div className="rounded border p-4">
      <p className="text-sm">
        Last ping: {lat.toFixed(5)}, {lng.toFixed(5)}
      </p>
      <p className="text-xs text-slate-600">
        {new Date(recordedAt).toISOString()} · open block:{' '}
        {live.openBlock?.type ?? 'none'}
      </p>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-sm text-blue-700 underline"
      >
        Open in Google Maps
      </a>
    </div>
  );
}
