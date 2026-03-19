import { IsString, IsNumber, IsOptional, IsBoolean, Min, IsDateString, IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePayableDto {
  @IsString() supplier: string;
  @IsString() categoryId: string;
  @IsString() description: string;
  @IsNumber() @Min(0.01) amount: number;
  @IsDateString() dueDate: string;
  @IsOptional() @IsString() costCenter?: string;
  @IsOptional() @IsBoolean() isRecurring?: boolean;
  @IsOptional() @IsNumber() recurrenceDay?: number;
  @IsOptional() @IsString() notes?: string;
}

export class PayPayableDto {
  @IsNumber() @Min(0.01) amount: number;
  @IsDateString() paidAt: string;
  @IsEnum(PaymentMethod) paymentMethod: PaymentMethod;
  @IsOptional() @IsString() notes?: string;
}

export class CreateCategoryDto {
  @IsString() name: string;
  @IsOptional() @IsString() color?: string;
}
