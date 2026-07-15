import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class AllocationLineDto {
  @IsOptional()
  @IsString()
  serviceOrderId?: string;

  @IsInt()
  @Min(0)
  minutes!: number;

  @IsOptional()
  @IsBoolean()
  isNonBillable?: boolean;
}

export class SaveAllocationDto {
  @IsString()
  editedBy!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AllocationLineDto)
  lines!: AllocationLineDto[];
}

export class EditVisitTimesDto {
  @IsOptional()
  @IsISO8601()
  arrivedAt?: string;

  @IsOptional()
  @IsISO8601()
  departedAt?: string;

  @IsString()
  reason!: string;

  @IsString()
  editedBy!: string;
}

export class CompleteVisitDto {
  @IsString()
  editedBy!: string;
}
