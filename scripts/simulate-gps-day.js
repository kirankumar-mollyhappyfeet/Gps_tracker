const API = process.env.API_URL || 'http://localhost:3001';

const HOME = { lat: 55.6761, lng: 12.5683 };
const MID1 = { lat: 55.70, lng: 12.57 };
const HANSEN = { lat: 55.7305, lng: 12.5712 };
const MID2 = { lat: 55.705, lng: 12.575 };
const CLIENT = { lat: 55.68, lng: 12.58 };
const AWAY = { lat: 55.69, lng: 12.59 };

async function ping(at, point) {
  const res = await fetch(`${API}/gps/pings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceExternalId: 'tracker-van-1',
      lat: point.lat,
      lng: point.lng,
      recordedAt: at,
    }),
  });
  const body = await res.json();
  console.log(at, point.lat.toFixed(4), res.status, body.duplicate ? 'dup' : 'ok');
  if (!res.ok) throw new Error(JSON.stringify(body));
}

async function main() {
  const day = '2026-07-15';

  // Morning at depot
  await ping(`${day}T06:00:00.000Z`, HOME);
  await ping(`${day}T06:15:00.000Z`, HOME);
  await ping(`${day}T07:00:00.000Z`, HOME);

  // Travel to single order (Hansen)
  await ping(`${day}T07:30:00.000Z`, MID1);
  await ping(`${day}T08:00:00.000Z`, HANSEN);
  await ping(`${day}T08:15:00.000Z`, HANSEN); // confirms on_site
  await ping(`${day}T09:00:00.000Z`, HANSEN);
  await ping(`${day}T09:15:00.000Z`, MID2); // leave → confirmed single visit

  // Travel to building with 3 orders
  await ping(`${day}T09:45:00.000Z`, CLIENT);
  await ping(`${day}T10:00:00.000Z`, CLIENT); // confirms on_site
  await ping(`${day}T11:00:00.000Z`, CLIENT);
  await ping(`${day}T12:00:00.000Z`, CLIENT);
  await ping(`${day}T12:15:00.000Z`, AWAY); // leave → pending_allocation

  const vehicles = await (await fetch(`${API}/vehicles`)).json();
  const vehicleId = vehicles[0].id;
  const blocks = await (
    await fetch(`${API}/vehicles/${vehicleId}/blocks?date=${day}`)
  ).json();
  console.log('\nBlocks:');
  blocks.forEach((b) =>
    console.log(`  ${b.type.padEnd(12)} ${b.status.padEnd(8)} ${b.startAt}`),
  );

  const dayView = await (
    await fetch(`${API}/tech/day?vehicleId=${vehicleId}&date=${day}`)
  ).json();
  console.log('\nVisits:');
  dayView.visits.forEach((v) =>
    console.log(
      `  ${v.status.padEnd(20)} dwell=${String(v.dwellMinutes).padStart(3)}m orders=${v.orderLinks.length}`,
    ),
  );
  console.log('\nSummary:', dayView.summary);
  console.log('\nOpen http://localhost:3000/tech and /admin');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
