import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AllocationService } from './allocation.service';
import {
  CompleteVisitDto,
  EditVisitTimesDto,
  SaveAllocationDto,
} from './dto/allocation.dto';

@Controller('site-visits')
export class AllocationController {
  constructor(private readonly allocationService: AllocationService) {}

  @Get(':id')
  get(@Param('id') id: string) {
    return this.allocationService.getVisit(id);
  }

  @Post(':id/allocations')
  saveAllocations(@Param('id') id: string, @Body() dto: SaveAllocationDto) {
    return this.allocationService.saveAllocations(id, dto);
  }

  @Patch(':id/times')
  editTimes(@Param('id') id: string, @Body() dto: EditVisitTimesDto) {
    return this.allocationService.editTimes(id, dto);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() dto: CompleteVisitDto) {
    return this.allocationService.complete(id, dto);
  }
}
