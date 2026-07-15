import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.timeAllocation.deleteMany();
  await prisma.timeEditAudit.deleteMany();
  await prisma.siteVisitOrderLink.deleteMany();
  await prisma.siteVisit.deleteMany();
  await prisma.locationBlock.deleteMany();
  await prisma.gpsPing.deleteMany();
  await prisma.serviceOrder.deleteMany();
  await prisma.gpsDevice.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.organization.deleteMany();

  const org = await prisma.organization.create({
    data: { name: 'Knop PVS Demo' },
  });
  const vehicle = await prisma.vehicle.create({
    data: {
      organizationId: org.id,
      name: 'Van 1',
      homeLat: 55.6761,
      homeLng: 12.5683,
      geofenceRadiusMeters: 150,
      device: { create: { externalId: 'tracker-van-1' } },
    },
  });
  const clientLat = 55.68;
  const clientLng = 12.58;
  await prisma.serviceOrder.createMany({
    data: [
      {
        organizationId: org.id,
        customerName: 'Acme Apt 1',
        address: 'Client Building A - Unit 1',
        lat: clientLat,
        lng: clientLng,
        serviceLocationId: 'loc-building-a',
        scheduledAt: new Date('2026-07-15T09:00:00.000Z'),
        technicianName: 'Lars',
        vehicleId: vehicle.id,
      },
      {
        organizationId: org.id,
        customerName: 'Acme Apt 2',
        address: 'Client Building A - Unit 2',
        lat: clientLat,
        lng: clientLng,
        serviceLocationId: 'loc-building-a',
        scheduledAt: new Date('2026-07-15T09:00:00.000Z'),
        technicianName: 'Lars',
        vehicleId: vehicle.id,
      },
      {
        organizationId: org.id,
        customerName: 'Acme Apt 3',
        address: 'Client Building A - Unit 3',
        lat: clientLat,
        lng: clientLng,
        serviceLocationId: 'loc-building-a',
        scheduledAt: new Date('2026-07-15T09:00:00.000Z'),
        technicianName: 'Lars',
        vehicleId: vehicle.id,
      },
    ],
  });
  console.log({ orgId: org.id, vehicleId: vehicle.id, deviceId: 'tracker-van-1' });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
