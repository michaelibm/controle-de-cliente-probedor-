import {
  IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum,
  IsDateString, ValidateNested, IsNumber, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType, DocumentType, CustomerStatus } from '@prisma/client';

export class CreateAddressDto {
  @ApiProperty({ example: '01310-100' })
  @IsNotEmpty() @IsString() zipCode: string;

  @ApiProperty({ example: 'Rua das Flores' })
  @IsNotEmpty() @IsString() street: string;

  @ApiProperty({ example: '123' })
  @IsNotEmpty() @IsString() number: string;

  @ApiPropertyOptional() @IsOptional() @IsString() complement?: string;

  @ApiProperty({ example: 'Centro' })
  @IsNotEmpty() @IsString() neighborhood: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsNotEmpty() @IsString() city: string;

  @ApiProperty({ example: 'SP' })
  @IsNotEmpty() @IsString() state: string;

  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() longitude?: number;
}

export class CreateCustomerDto {
  @ApiPropertyOptional({ enum: CustomerType, default: CustomerType.INDIVIDUAL })
  @IsOptional() @IsEnum(CustomerType) type?: CustomerType;

  @ApiProperty({ example: 'João da Silva' })
  @IsNotEmpty({ message: 'Nome obrigatório' }) @IsString() name: string;

  @ApiProperty({ example: '123.456.789-00' })
  @IsNotEmpty({ message: 'CPF/CNPJ obrigatório' }) @IsString() document: string;

  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType) documentType: DocumentType;

  @ApiPropertyOptional() @IsOptional() @IsString() rg?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() birthDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail({}, { message: 'E-mail inválido' }) email?: string;

  @ApiProperty({ example: '(11) 99999-9999' })
  @IsNotEmpty({ message: 'Telefone obrigatório' }) @IsString() phone: string;

  @ApiPropertyOptional() @IsOptional() @IsString() phoneSecondary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() whatsapp?: string;

  @ApiPropertyOptional({ enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  @IsOptional() @IsEnum(CustomerStatus) status?: CustomerStatus;

  @ApiPropertyOptional() @IsOptional() @IsString() origin?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sellerId?: string;

  @ApiPropertyOptional({ type: CreateAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;
}
