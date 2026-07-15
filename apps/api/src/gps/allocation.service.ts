import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { validateAllocations } from './domain/allocation';
import {
  CompleteVisitDto,
  EditVisitTimesDto,
  SaveAllocationDto,
} from './dto/allocation.dto';
import { StubTimeSync, TimeSyncPort } from './time-sync.port';

@Injectable()
export class AllocationService {
  private readonly timeSync: TimeSyncPort = new StubTimeSync();

  constructor(private readonly prisma: PrismaService) {}

  async getVisit(id: string) {
    const visit = await this.prisma.siteVisit.findUnique({
      where: { id },
      include: {
        orderLinks: { include: { serviceOrder: true } },
        allocations: true,
        audits: { orderBy: { editedAt: 'desc' } },
      },
    });
    if (!visit) throw new NotFoundException('Site visit not found');
    return visit;
  }

  async saveAllocations(id: string, dto: SaveAllocationDto) {
    const visit = await this.getVisit(id);
    if (!['departed', 'pending_allocation', 'confirmed'].includes(visit.status)) {
      throw new BadRequestException(
        `Cannot allocate in status ${visit.status}`,
      );
    }
    if (visit.dwellMinutes == null) {
      throw new BadRequestException('Visit has no dwellMinutes');
    }

    const lines = dto.lines.map((l) => ({
      serviceOrderId: l.isNonBillable ? null : (l.serviceOrderId ?? null),
      minutes: l.minutes,
      isNonBillable: Boolean(l.isNonBillable),
    }));

    const result = validateAllocations({
      dwellMinutes: visit.dwellMinutes,
      lines,
      toleranceMinutes: Number(process.env.ALLOCATION_TOLERANCE_MINUTES ?? 30),
    });
    if (!result.ok) {
      throw new BadRequestException(result.error);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.timeAllocation.deleteMany({ where: { siteVisitId: id } });
      await tx.timeAllocation.createMany({
        data: lines.map((l) => ({
          siteVisitId: id,
          serviceOrderId: l.serviceOrderId,
          minutes: l.minutes,
          isNonBillable: l.isNonBillable,
        })),
      });
      await tx.siteVisit.update({
        where: { id },
        data: {
          status:
            visit.orderLinks.length >= 2 ? 'allocated' : 'confirmed',
        },
      });
      await tx.timeEditAudit.create({
        data: {
          siteVisitId: id,
          field: 'allocations',
          oldValue: JSON.stringify(visit.allocations),
          newValue: JSON.stringify(lines),
          reason: 'allocation saved',
          editedBy: dto.editedBy,
        },
      });
    });

    return this.getVisit(id);
  }

  async editTimes(id: string, dto: EditVisitTimesDto) {
    const visit = await this.getVisit(id);
    const audits: {
      field: string;
      oldValue: string;
      newValue: string;
    }[] = [];

    let arrivedAt = visit.arrivedAt;
    let departedAt = visit.departedAt;

    if (dto.arrivedAt) {
      audits.push({
        field: 'arrivedAt',
        oldValue: String(visit.arrivedAt),
        newValue: dto.arrivedAt,
      });
      arrivedAt = new Date(dto.arrivedAt);
    }
    if (dto.departedAt) {
      audits.push({
        field: 'departedAt',
        oldValue: String(visit.departedAt),
        newValue: dto.departedAt,
      });
      departedAt = new Date(dto.departedAt);
    }

    if (!arrivedAt || !departedAt) {
      throw new BadRequestException('arrivedAt and departedAt required');
    }

    const dwellMinutes = Math.round(
      (departedAt.getTime() - arrivedAt.getTime()) / 60000,
    );
    const needsRealloc = visit.orderLinks.length >= 2;

    await this.prisma.$transaction(async (tx) => {
      if (needsRealloc) {
        await tx.timeAllocation.deleteMany({ where: { siteVisitId: id } });
      }
      await tx.siteVisit.update({
        where: { id },
        data: {
          arrivedAt,
          departedAt,
          dwellMinutes,
          status: needsRealloc ? 'pending_allocation' : visit.status,
        },
      });
      for (const a of audits) {
        await tx.timeEditAudit.create({
          data: {
            siteVisitId: id,
            field: a.field,
            oldValue: a.oldValue,
            newValue: a.newValue,
            reason: dto.reason,
            editedBy: dto.editedBy,
          },
        });
      }
    });

    return this.getVisit(id);
  }

  async complete(id: string, dto: CompleteVisitDto) {
    const visit = await this.getVisit(id);
    if (!['allocated', 'confirmed'].includes(visit.status)) {
      throw new BadRequestException(
        `Visit must be allocated or confirmed before complete (now ${visit.status})`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.siteVisit.update({
        where: { id },
        data: { status: 'completed' },
      });
      await tx.serviceOrder.updateMany({
        where: {
          id: { in: visit.orderLinks.map((l) => l.serviceOrderId) },
        },
        data: { status: 'completed' },
      });
      await tx.timeEditAudit.create({
        data: {
          siteVisitId: id,
          field: 'status',
          oldValue: visit.status,
          newValue: 'completed',
          reason: 'completed',
          editedBy: dto.editedBy,
        },
      });
    });

    await this.timeSync.enqueueApprovedHours(id);
    return this.getVisit(id);
  }
}
