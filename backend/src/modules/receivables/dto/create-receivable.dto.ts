import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsDateString, Min, IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReceivableType, PaymentMethod } from '@prisma/client';

export class CreateReceivableDto {
  @ApiProperty() @IsNotEmpty() @IsString() customerId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contractId?: string;
  @ApiProperty({ example: 'Mensalidade 01/2024' }) @IsNotEmpty() @IsString() description: string;

  @ApiPropertyOptional({ enum: ReceivableType, default: ReceivableType.MONTHLY })
  @IsOptional() @IsEnum(ReceivableType) type?: ReceivableType;

  @ApiProperty({ example: 109.90 })
  @Type(() => Number) @IsNumber() @Min(0) principalAmount: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discount?: number;

  @ApiProperty({ example: '2024-01-10' }) @IsDateString() dueDate: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class PayReceivableDto {
  @ApiProperty({ example: 109.90 })
  @Type(() => Number) @IsNumber() @Min(0.01) amount: number;

  @ApiProperty({ enum: PaymentMethod }) @IsEnum(PaymentMethod) paymentMethod: PaymentMethod;

  @ApiProperty({ example: '2024-01-10' }) @IsDateString() paidAt: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() receiptUrl?: string;
}

export class RenegotiateReceivableDto {
  @ApiProperty({ example: '2024-02-10' }) @IsDateString() newDueDate: string;
  @ApiProperty({ example: 120.00 }) @Type(() => Number) @IsNumber() @Min(0) newAmount: number;
  @ApiPropertyOptional({ example: 10 }) @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discount?: number;
  @ApiProperty({ example: 'Acordo por telefone' }) @IsNotEmpty() @IsString() reason: string;
}

export class FilterReceivableDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contractId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentMethod?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() planId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() neighborhood?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dueDateStart?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dueDateEnd?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paidDateStart?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paidDateEnd?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() minAmount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() maxAmount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() daysOverdueMin?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() dueToday?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() dueThisWeek?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() paidToday?: boolean;
}
