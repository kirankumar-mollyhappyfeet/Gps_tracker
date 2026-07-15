import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IngestPingDto } from './dto/ingest-ping.dto';
import { isWithinRadius } from './domain/geo';
import {
  applyPingToBlocks,
  BlockDraft,
} from './domain/location-block-builder';
import { applyFencePing, DwellState } from './domain/site-visit-dwell';

@Injectable()
export class GpsIngestService {
  constructor(private readonly prisma: PrismaService) {}

  async ingest(dto: IngestPingDto) {
    const device = await this.prisma.gpsDevice.findUnique({
      where: { externalId: dto.deviceExternalId },
      include: { vehicle: true },
    });
    if (!device) {
      throw new NotFoundException(`Unknown device ${dto.deviceExternalId}`);
    }

    const recordedAt = new Date(dto.recordedAt);
    if (Number.isNaN(recordedAt.getTime())) {
      throw new BadRequestException('Invalid recordedAt');
    }

    let pingId: string;
    try {
      const ping = await this.prisma.gpsPing.create({
        data: {
          vehicleId: device.vehicleId,
          deviceId: device.externalId,
          lat: dto.lat,
          lng: dto.lng,
          recordedAt,
          speed: dto.speed,
          ignition: dto.ignition,
        },
      });
      pingId = ping.id;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        return { pingId: null, duplicate: true };
      }
      throw e;
    }

    await this.processPing({
      vehicleId: device.vehicleId,
      vehicle: device.vehicle,
      point: { lat: dto.lat, lng: dto.lng },
      at: recordedAt,
    });

    return { pingId, duplicate: false };
  }

  private async processPing(args: {
    vehicleId: string;
    vehicle: {
      homeLat: number;
      homeLng: number;
      geofenceRadiusMeters: number;
    };
    point: { lat: number; lng: number };
    at: Date;
  }) {
    const radius = args.vehicle.geofenceRadiusMeters;
    const home = { lat: args.vehicle.homeLat, lng: args.vehicle.homeLng };

    const existing = await this.prisma.locationBlock.findMany({
      where: { vehicleId: args.vehicleId },
      orderBy: { startAt: 'asc' },
    });

    let drafts: BlockDraft[] = existing.map((b) => ({
      type: b.type as BlockDraft['type'],
      startAt: b.startAt,
      endAt: b.endAt,
      center: { lat: b.centerLat, lng: b.centerLng },
      status: b.status as BlockDraft['status'],
    }));

    drafts = applyPingToBlocks({
      blocks: drafts,
      ping: { at: args.at, point: args.point },
      home,
      clusterRadiusMeters: radius,
    });

    await this.persistBlocks(args.vehicleId, existing, drafts);

    // Always evaluate open site visits against this ping (handles leave → traveled)
    await this.updateOpenSiteVisits(args.vehicleId, args.point, args.at, radius);

    const open = drafts.find((d) => d.status === 'open');
    if (open?.type === 'stationary') {
      await this.ensureSiteVisitForStationary(
        args.vehicleId,
        args.point,
        args.at,
        radius,
      );
    }
  }

  private async ensureSiteVisitForStationary(
    vehicleId: string,
    point: { lat: number; lng: number },
    at: Date,
    radius: number,
  ) {
    const orders = await this.findClusterOrders(vehicleId, point, radius);
    if (orders.length === 0) return;

    const persistedOpen = await this.prisma.locationBlock.findFirst({
      where: { vehicleId, status: 'open', type: 'stationary' },
      orderBy: { startAt: 'desc' },
    });
    if (!persistedOpen) return;

    let visit = await this.prisma.siteVisit.findFirst({
      where: {
        vehicleId,
        locationBlockId: persistedOpen.id,
        status: { in: ['candidate', 'on_site'] },
      },
      include: { orderLinks: true },
    });

    if (!visit) {
      visit = await this.prisma.siteVisit.create({
        data: {
          vehicleId,
          locationBlockId: persistedOpen.id,
          status: 'candidate',
          orderLinks: {
            create: orders.map((o) => ({ serviceOrderId: o.id })),
          },
        },
        include: { orderLinks: true },
      });
    } else {
      for (const order of orders) {
        if (!visit.orderLinks.some((l) => l.serviceOrderId === order.id)) {
          await this.prisma.siteVisitOrderLink.create({
            data: { siteVisitId: visit.id, serviceOrderId: order.id },
          });
        }
      }
    }

    await this.updateOpenSiteVisits(vehicleId, point, at, radius);
  }

  private async updateOpenSiteVisits(
    vehicleId: string,
    point: { lat: number; lng: number },
    at: Date,
    radius: number,
  ) {
    const openVisits = await this.prisma.siteVisit.findMany({
      where: {
        vehicleId,
        status: { in: ['candidate', 'on_site'] },
      },
      include: { orderLinks: { include: { serviceOrder: true } } },
    });

    for (const visit of openVisits) {
      const order = visit.orderLinks[0]?.serviceOrder;
      if (!order) continue;

      const previous: DwellState = {
        status: visit.status as 'candidate' | 'on_site',
        inFencePingCount: visit.inFencePingCount,
        arrivedAt: visit.arrivedAt ?? undefined,
        lastInFenceAt: visit.lastInFenceAt ?? visit.arrivedAt ?? undefined,
      };

      const next = applyFencePing(previous, {
        at,
        point,
        fenceCenter: { lat: order.lat, lng: order.lng },
        radiusMeters: radius,
      });

      if (next.status === 'none') {
        await this.prisma.siteVisit.delete({ where: { id: visit.id } });
        continue;
      }

      if (next.status === 'departed') {
        const linkCount = visit.orderLinks.length;
        await this.prisma.siteVisit.update({
          where: { id: visit.id },
          data: {
            status: linkCount >= 2 ? 'pending_allocation' : 'confirmed',
            arrivedAt: next.arrivedAt ?? null,
            departedAt: next.departedAt ?? null,
            lastInFenceAt: next.lastInFenceAt ?? null,
            dwellMinutes: next.dwellMinutes ?? null,
            inFencePingCount: next.inFencePingCount,
          },
        });
        continue;
      }

      await this.prisma.siteVisit.update({
        where: { id: visit.id },
        data: {
          status: next.status,
          arrivedAt: next.arrivedAt ?? null,
          lastInFenceAt: next.lastInFenceAt ?? null,
          inFencePingCount: next.inFencePingCount,
        },
      });

      if (next.status === 'on_site') {
        await this.prisma.serviceOrder.updateMany({
          where: {
            id: { in: visit.orderLinks.map((l) => l.serviceOrderId) },
          },
          data: { status: 'arrived' },
        });
      }
    }
  }

  private async persistBlocks(
    vehicleId: string,
    existing: { id: string }[],
    drafts: BlockDraft[],
  ) {
    for (let i = existing.length - 1; i >= drafts.length; i--) {
      await this.prisma.locationBlock
        .delete({ where: { id: existing[i].id } })
        .catch(() => undefined);
    }

    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      const ex = existing[i];
      if (ex) {
        await this.prisma.locationBlock.update({
          where: { id: ex.id },
          data: {
            type: d.type,
            status: d.status,
            startAt: d.startAt,
            endAt: d.endAt,
            centerLat: d.center.lat,
            centerLng: d.center.lng,
          },
        });
      } else {
        await this.prisma.locationBlock.create({
          data: {
            vehicleId,
            type: d.type,
            status: d.status,
            startAt: d.startAt,
            endAt: d.endAt,
            centerLat: d.center.lat,
            centerLng: d.center.lng,
          },
        });
      }
    }
  }

  private async findClusterOrders(
    vehicleId: string,
    point: { lat: number; lng: number },
    radius: number,
  ) {
    const orders = await this.prisma.serviceOrder.findMany({
      where: {
        vehicleId,
        status: { in: ['scheduled', 'arrived'] },
      },
    });

    const near = orders.filter((o) =>
      isWithinRadius(point, { lat: o.lat, lng: o.lng }, radius),
    );
    if (near.length === 0) return [];

    const locationIds = new Set(
      near.map((o) => o.serviceLocationId).filter(Boolean) as string[],
    );
    if (locationIds.size === 0) return near;

    return orders.filter(
      (o) =>
        (o.serviceLocationId && locationIds.has(o.serviceLocationId)) ||
        near.some((n) => n.id === o.id),
    );
  }
}
