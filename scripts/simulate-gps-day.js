const API = process.env.API_URL || 'http://localhost:3001';

const HOME = { lat: 55.6761, lng: 12.5683 };
const MID = { lat: 55.678, lng: 12.574 };
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
  console.log(at, res.status, body);
  if (!res.ok) throw new Error(JSON.stringify(body));
}

async function main() {
  const day = '2026-07-15';
  await ping(`${day}T06:00:00.000Z`, HOME);
  await ping(`${day}T06:15:00.000Z`, HOME);
  await ping(`${day}T07:00:00.000Z`, HOME);
  await ping(`${day}T08:00:00.000Z`, HOME);
  await ping(`${day}T08:15:00.000Z`, MID);
  await ping(`${day}T09:00:00.000Z`, CLIENT);
  await ping(`${day}T09:15:00.000Z`, CLIENT);
  await ping(`${day}T10:00:00.000Z`, CLIENT);
  await ping(`${day}T11:00:00.000Z`, CLIENT);
  await ping(`${day}T11:15:00.000Z`, AWAY);

  const vehicles = await (await fetch(`${API}/vehicles`)).json();
  const vehicleId = vehicles[0].id;
  const blocks = await (
    await fetch(`${API}/vehicles/${vehicleId}/blocks?date=${day}`)
  ).json();
  console.log(
    'blocks',
    blocks.map((b) => `${b.type}/${b.status}`),
  );
  const dayView = await (
    await fetch(`${API}/tech/day?vehicleId=${vehicleId}&date=${day}`)
  ).json();
  console.log(
    'visits',
    dayView.visits.map((v) => ({
      id: v.id,
      status: v.status,
      dwellMinutes: v.dwellMinutes,
      orders: v.orderLinks.length,
    })),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
