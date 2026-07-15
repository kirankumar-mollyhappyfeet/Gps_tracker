import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { GpsIngestService } from './gps-ingest.service';
import { IngestPingDto } from './dto/ingest-ping.dto';

@Controller('gps')
export class GpsIngestController {
  constructor(private readonly ingestService: GpsIngestService) {}

  @Post('pings')
  @HttpCode(201)
  ingest(@Body() dto: IngestPingDto) {
    return this.ingestService.ingest(dto);
  }
}
