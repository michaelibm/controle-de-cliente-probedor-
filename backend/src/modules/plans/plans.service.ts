import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePlanDto) {
    return this.prisma.plan.create({ data: dto as any });
  }

  async findAll(onlyActive = false) {
    const plans = await this.prisma.plan.findMany({
      where: { deletedAt: null, ...(onlyActive && { isActive: true }) },
      include: { _count: { select: { contracts: true } } },
      orderBy: { monthlyPrice: 'asc' },
    });
    return plans;
  }

  async findOne(id: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { contracts: true } } },
    });
    if (!plan) throw new NotFoundException('Plano não encontrado');
    return plan;
  }

  async update(id: string, dto: Partial<CreatePlanDto>) {
    await this.findOne(id);
    return this.prisma.plan.update({ where: { id }, data: dto as any });
  }

  async toggleActive(id: string) {
    const plan = await this.findOne(id);
    return this.prisma.plan.update({
      where: { id },
      data: { isActive: !plan.isActive },
      select: { id: true, name: true, isActive: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.plan.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  }

  async getStats(id: string) {
    await this.findOne(id);
    const [activeContracts, revenue] = await Promise.all([
      this.prisma.contract.count({
        where: { planId: id, status: 'ACTIVE' },
      }),
      this.prisma.receivable.aggregate({
        _sum: { paidAmount: true },
        where: {
          contract: { planId: id },
          status: 'PAID',
          deletedAt: null,
        },
      }),
    ]);
    return {
      activeContracts,
      totalRevenue: Number(revenue._sum.paidAmount ?? 0),
    };
  }
}
