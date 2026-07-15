import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AllocationService } from './allocation.service';
import {
  ApproveTimeDto,
  CompleteVisitDto,
  EditVisitTimesDto,
  SaveAllocationDto,
  UpdateNotesDto,
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

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveTimeDto) {
    return this.allocationService.approveSuggestedTime(id, dto);
  }

  @Patch(':id/times')
  editTimes(@Param('id') id: string, @Body() dto: EditVisitTimesDto) {
    return this.allocationService.editTimes(id, dto);
  }

  @Patch(':id/notes')
  notes(@Param('id') id: string, @Body() dto: UpdateNotesDto) {
    return this.allocationService.updateNotes(id, dto);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() dto: CompleteVisitDto) {
    return this.allocationService.complete(id, dto);
  }
}
