import { Module } from '@nestjs/common';
import { GpsIngestController } from './gps-ingest.controller';
import { GpsIngestService } from './gps-ingest.service';
import { AllocationController } from './allocation.controller';
import { AllocationService } from './allocation.service';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';

@Module({
  controllers: [GpsIngestController, AllocationController, QueryController],
  providers: [GpsIngestService, AllocationService, QueryService],
})
export class GpsModule {}
