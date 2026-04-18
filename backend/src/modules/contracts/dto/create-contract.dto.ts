import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum,
  IsDateString, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractStatus } from '@prisma/client';

export class CreateContractDto {
  @ApiProperty() @IsNotEmpty() @IsString() customerId: string;
  @ApiProperty() @IsNotEmpty() @IsString() planId: string;

  @ApiPropertyOptional({ enum: ContractStatus, default: ContractStatus.ACTIVE })
  @IsOptional() @IsEnum(ContractStatus) status?: ContractStatus;

  @ApiProperty({ example: 109.90 })
  @Type(() => Number) @IsNumber() @Min(0) monthlyValue: number;

  @ApiProperty({ example: 7, description: 'Dia de vencimento (7, 20 ou 30)' })
  @Type(() => Number) @IsNumber() @Min(1) @Max(30) dueDay: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discount?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) finePercent?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) interestPercent?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) fidelityMonths?: number;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString() startDate: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString() activationDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
