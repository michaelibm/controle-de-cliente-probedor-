import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PayableStatus, PaymentMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination.dto';
import { startOfDay } from 'date-fns';
import { CreatePayableDto, PayPayableDto, CreateCategoryDto } from './dto/payable.dto';

@Injectable()
export class PayablesService {
  constructor(private prisma: PrismaService) {}

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.payable.count({
      where: { code: { startsWith: `PAG-${year}` } },
    });
    return `PAG-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async create(dto: CreatePayableDto) {
    const code = await this.generateCode();
    return this.prisma.payable.create({
      data: {
        code,
        supplier: dto.supplier,
        categoryId: dto.categoryId,
        description: dto.description,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        costCenter: dto.costCenter,
        isRecurring: dto.isRecurring ?? false,
        recurrenceDay: dto.recurrenceDay,
        notes: dto.notes,
        status: PayableStatus.PENDING,
      },
      include: { category: true },
    });
  }

  async findAll(filters: {
    search?: string;
    categoryId?: string;
    status?: string;
    dueDateStart?: string;
    dueDateEnd?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 25 } = filters;
    const skip = (page - 1) * limit;

    const statusList = filters.status
      ? (filters.status.split(',') as PayableStatus[])
      : undefined;

    const where: Prisma.PayableWhereInput = {
      deletedAt: null,
      ...(statusList && { status: { in: statusList } }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.search && {
        OR: [
          { supplier: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
      ...((filters.dueDateStart || filters.dueDateEnd) ? {
        dueDate: {
          ...(filters.dueDateStart && { gte: new Date(filters.dueDateStart) }),
          ...(filters.dueDateEnd && { lte: new Date(filters.dueDateEnd) }),
        },
      } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.payable.findMany({
        where, skip, take: limit,
        include: { category: true },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.payable.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const p = await this.prisma.payable.findFirst({
      where: { id, deletedAt: null },
      include: { category: true, payments: true },
    });
    if (!p) throw new NotFoundException('Conta a pagar não encontrada');
    return p;
  }

  async pay(id: string, dto: PayPayableDto, userId: string) {
    const payable = await this.findOne(id);
    if (payable.status === PayableStatus.PAID) throw new BadRequestException('Já está pago');
    if (payable.status === PayableStatus.CANCELLED) throw new BadRequestException('Cancelado');

    return this.prisma.$transaction(async (tx) => {
      await tx.payablePayment.create({
        data: {
          payableId: id,
          amount: dto.amount,
          paidAt: new Date(dto.paidAt),
          registeredBy: userId,
        },
      });
      return tx.payable.update({
        where: { id },
        data: { status: PayableStatus.PAID, paidDate: new Date(dto.paidAt), paymentMethod: dto.paymentMethod },
        include: { category: true },
      });
    });
  }

  async cancel(id: string) {
    await this.findOne(id);
    return this.prisma.payable.update({
      where: { id },
      data: { status: PayableStatus.CANCELLED },
    });
  }

  async markOverdue() {
    const today = startOfDay(new Date());
    const result = await this.prisma.payable.updateMany({
      where: { status: PayableStatus.PENDING, dueDate: { lt: today }, deletedAt: null },
      data: { status: PayableStatus.OVERDUE },
    });
    return result.count;
  }

  async getCategories() {
    return this.prisma.payableCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.payableCategory.create({
      data: { name: dto.name, color: dto.color },
    });
  }
}
