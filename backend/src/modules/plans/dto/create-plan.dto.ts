import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanCategory } from '@prisma/client';

export class CreatePlanDto {
  @ApiProperty({ example: 'Fibra 200MB' })
  @IsNotEmpty() @IsString() name: string;

  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;

  @ApiProperty({ example: 200 })
  @Type(() => Number) @IsNumber() @Min(1) downloadSpeed: number;

  @ApiProperty({ example: 200 })
  @Type(() => Number) @IsNumber() @Min(1) uploadSpeed: number;

  @ApiProperty({ example: 109.90 })
  @Type(() => Number) @IsNumber() @Min(0) monthlyPrice: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) installFee?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) fidelityMonths?: number;

  @ApiPropertyOptional({ enum: PlanCategory, default: PlanCategory.RESIDENTIAL })
  @IsOptional() @IsEnum(PlanCategory) category?: PlanCategory;

  @ApiPropertyOptional({ default: false })
  @IsOptional() @IsBoolean() isPromo?: boolean;
}
