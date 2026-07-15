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

  // Single-order stop (different location)
  await prisma.serviceOrder.create({
    data: {
      organizationId: org.id,
      customerName: 'Hansen Villa',
      address: 'Strandvej 12, Hellerup',
      lat: 55.7305,
      lng: 12.5712,
      serviceLocationId: 'loc-hansen',
      scheduledAt: new Date('2026-07-15T08:30:00.000Z'),
      technicianName: 'Lars',
      vehicleId: vehicle.id,
      jobDescription: 'Leaking radiator — ground floor',
      keyBoxLocation: 'Left of garage door',
      accessCodes: 'Gate 4488',
      parkingInfo: 'Driveway OK',
      onSiteContact: 'Mrs Hansen',
      onSitePhone: '+45 20 00 00 01',
      safetyNotes: 'Dog in garden — call first',
    },
  });

  const clientLat = 55.68;
  const clientLng = 12.58;
  const multi = [
    ['Acme Apt 1', 'Building A — Unit 1', 'Clogged kitchen drain'],
    ['Acme Apt 2', 'Building A — Unit 2', 'Toilet flush valve'],
    ['Acme Apt 3', 'Building A — Unit 3', 'No hot water'],
  ] as const;

  for (const [name, address, job] of multi) {
    await prisma.serviceOrder.create({
      data: {
        organizationId: org.id,
        customerName: name,
        address,
        lat: clientLat,
        lng: clientLng,
        serviceLocationId: 'loc-building-a',
        scheduledAt: new Date('2026-07-15T10:00:00.000Z'),
        technicianName: 'Lars',
        vehicleId: vehicle.id,
        jobDescription: job,
        keyBoxLocation: 'Lobby key cabinet B',
        accessCodes: 'Main door 9921 · Lift floor 3',
        parkingInfo: 'Visitor bay 4–6',
        onSiteContact: 'Building manager Ole',
        onSitePhone: '+45 20 00 00 02',
        safetyNotes: 'Work boots required in basement',
      },
    });
  }

  console.log({
    orgId: org.id,
    vehicleId: vehicle.id,
    deviceId: 'tracker-van-1',
    tip: 'Run: node scripts/simulate-gps-day.js',
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
