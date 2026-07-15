import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { QueryService } from './query.service';

@Controller()
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Get('vehicles')
  listVehicles() {
    return this.queryService.listVehicles();
  }

  @Get('vehicles/:id/blocks')
  getBlocks(@Param('id') id: string, @Query('date') date?: string) {
    return this.queryService.getBlocks(id, date);
  }

  @Get('vehicles/:id/pings')
  getPings(@Param('id') id: string, @Query('blockId') blockId?: string) {
    return this.queryService.getPings(id, blockId);
  }

  @Get('vehicles/:id/live')
  getLive(@Param('id') id: string) {
    return this.queryService.getLive(id);
  }

  @Get('vehicles/:id/audits')
  getAudits(@Param('id') id: string) {
    return this.queryService.getAudits(id);
  }

  @Patch('vehicles/:id/geofence')
  updateGeofence(
    @Param('id') id: string,
    @Body() body: { geofenceRadiusMeters: number },
  ) {
    return this.queryService.updateGeofence(id, body.geofenceRadiusMeters);
  }

  @Get('tech/day')
  getTechDay(
    @Query('vehicleId') vehicleId: string,
    @Query('date') date?: string,
  ) {
    return this.queryService.getTechDay(vehicleId, date);
  }

  @Get('orders/:id/visits')
  getOrderVisits(@Param('id') id: string) {
    return this.queryService.getOrderVisitHistory(id);
  }
}
