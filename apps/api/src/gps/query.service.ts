import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class QueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getBlocks(vehicleId: string, date?: string) {
    await this.requireVehicle(vehicleId);
    const { start, end } = this.dayRange(date);
    return this.prisma.locationBlock.findMany({
      where: {
        vehicleId,
        startAt: { gte: start, lt: end },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async getPings(vehicleId: string, blockId?: string) {
    await this.requireVehicle(vehicleId);
    if (blockId) {
      const block = await this.prisma.locationBlock.findFirst({
        where: { id: blockId, vehicleId },
      });
      if (!block) throw new NotFoundException('Block not found');
      return this.prisma.gpsPing.findMany({
        where: {
          vehicleId,
          recordedAt: {
            gte: block.startAt,
            ...(block.endAt ? { lte: block.endAt } : {}),
          },
        },
        orderBy: { recordedAt: 'asc' },
      });
    }
    return this.prisma.gpsPing.findMany({
      where: { vehicleId },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    });
  }

  async getLive(vehicleId: string) {
    await this.requireVehicle(vehicleId);
    const lastPing = await this.prisma.gpsPing.findFirst({
      where: { vehicleId },
      orderBy: { recordedAt: 'desc' },
    });
    const openBlock = await this.prisma.locationBlock.findFirst({
      where: { vehicleId, status: 'open' },
      orderBy: { startAt: 'desc' },
    });
    return { lastPing, openBlock };
  }

  async getTechDay(vehicleId: string, date?: string) {
    await this.requireVehicle(vehicleId);
    const { start, end } = this.dayRange(date);
    const orders = await this.prisma.serviceOrder.findMany({
      where: { vehicleId },
      orderBy: { scheduledAt: 'asc' },
    });
    const visits = await this.prisma.siteVisit.findMany({
      where: {
        vehicleId,
        OR: [
          { arrivedAt: { gte: start, lt: end } },
          { createdAt: { gte: start, lt: end } },
        ],
      },
      include: {
        orderLinks: { include: { serviceOrder: true } },
        allocations: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    return { orders, visits };
  }

  async listVehicles() {
    return this.prisma.vehicle.findMany({
      include: { device: true },
    });
  }

  async updateGeofence(vehicleId: string, geofenceRadiusMeters: number) {
    await this.requireVehicle(vehicleId);
    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { geofenceRadiusMeters },
    });
  }

  private async requireVehicle(vehicleId: string) {
    const v = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!v) throw new NotFoundException('Vehicle not found');
    return v;
  }

  private dayRange(date?: string) {
    const d = date ? new Date(`${date}T00:00:00.000Z`) : new Date();
    if (!date) {
      d.setUTCHours(0, 0, 0, 0);
    }
    const start = d;
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }
}
