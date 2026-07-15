import {
  IsBoolean,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class IngestPingDto {
  @IsString()
  deviceExternalId!: string;

  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsISO8601()
  recordedAt!: string;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsBoolean()
  ignition?: boolean;
}
