import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ContractStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { addMonths } from 'date-fns';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService, private webhook: WebhookService) {}

  private async generateNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.contract.count({
      where: { number: { startsWith: `CTR-${year}` } },
    });
    return `CTR-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  async create(dto: CreateContractDto, userId: string) {
    const number = await this.generateNumber();
    const fidelityEndDate = dto.fidelityMonths && dto.fidelityMonths > 0
      ? addMonths(new Date(dto.startDate), dto.fidelityMonths)
      : null;

    const contract = await this.prisma.contract.create({
      data: {
        number,
        customerId: dto.customerId,
        planId: dto.planId,
        status: dto.status ?? ContractStatus.ACTIVE,
        monthlyValue: dto.monthlyValue,
        dueDay: dto.dueDay,
        discount: dto.discount ?? 0,
        finePercent: dto.finePercent ?? 2,
        interestPercent: dto.interestPercent ?? 1,
        fidelityMonths: dto.fidelityMonths ?? 0,
        startDate: new Date(dto.startDate),
        activationDate: dto.activationDate ? new Date(dto.activationDate) : null,
        fidelityEndDate,
        notes: dto.notes,
      },
      include: { customer: { select: { id: true, name: true } }, plan: true },
    });

    this.webhook.send('contract.created', {
      contractId: contract.id,
      contractNumber: contract.number,
      customerId: contract.customerId,
      customerName: contract.customer?.name,
      planName: contract.plan?.name,
      monthlyValue: contract.monthlyValue,
      dueDay: contract.dueDay,
      status: contract.status,
    });

    return contract;
  }

  async findAll(filters: {
    customerId?: string;
    status?: ContractStatus;
    planId?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { customerId, status, planId, page = 1, limit = 25 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ContractWhereInput = {
      ...(customerId && { customerId }),
      ...(status && { status }),
      ...(planId && { planId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, name: true, document: true, status: true } },
          plan: { select: { id: true, name: true, downloadSpeed: true, uploadSpeed: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        customer: { include: { address: true } },
        plan: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        _count: { select: { receivables: true } },
      },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');
    return contract;
  }

  async update(id: string, dto: Partial<CreateContractDto>) {
    await this.findOne(id);
    return this.prisma.contract.update({
      where: { id },
      data: dto as any,
      include: { plan: true },
    });
  }

  private async changeStatus(
    id: string,
    toStatus: ContractStatus,
    changedBy: string,
    reason?: string,
  ) {
    const contract = await this.findOne(id);
    await this.prisma.$transaction([
      this.prisma.contract.update({
        where: { id },
        data: {
          status: toStatus,
          ...(toStatus === ContractStatus.CANCELLED && { cancellationDate: new Date() }),
        },
      }),
      this.prisma.contractStatusHistory.create({
        data: {
          contractId: id,
          fromStatus: contract.status,
          toStatus,
          reason,
          changedBy,
        },
      }),
    ]);
    return this.findOne(id);
  }

  async suspend(id: string, userId: string, reason?: string) {
    return this.changeStatus(id, ContractStatus.SUSPENDED, userId, reason);
  }

  async cancel(id: string, userId: string, reason?: string) {
    return this.changeStatus(id, ContractStatus.CANCELLED, userId, reason);
  }

  async reactivate(id: string, userId: string) {
    return this.changeStatus(id, ContractStatus.ACTIVE, userId, 'Reativação');
  }

  async getHistory(id: string) {
    return this.prisma.contractStatusHistory.findMany({
      where: { contractId: id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
