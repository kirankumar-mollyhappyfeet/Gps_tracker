export function formatTime(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toISOString().slice(11, 16) + ' UTC';
}

export function mapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
