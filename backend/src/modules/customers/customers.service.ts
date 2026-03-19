import {
  Injectable, ConflictException, NotFoundException,
} from '@nestjs/common';
import { CustomerStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { paginate } from '../../common/dto/pagination.dto';

export interface CustomerFilters {
  search?: string;
  status?: CustomerStatus;
  city?: string;
  neighborhood?: string;
  sellerId?: string;
  planId?: string;
  isDefaulting?: boolean;
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService, private webhook: WebhookService) {}

  async create(dto: CreateCustomerDto) {
    const exists = await this.prisma.customer.findUnique({
      where: { document: dto.document.replace(/\D/g, '') },
    });
    if (exists) throw new ConflictException('CPF/CNPJ já cadastrado');

    const { address, ...customerData } = dto;
    const customer = await this.prisma.customer.create({
      data: {
        ...customerData,
        document: dto.document.replace(/\D/g, ''),
        address: address ? { create: address } : undefined,
      },
      include: { address: true },
    });

    this.webhook.send('customer.created', {
      customerId: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      whatsapp: customer.whatsapp,
      document: customer.document,
      status: customer.status,
      city: customer.address?.city,
    });

    return customer;
  }

  async findAll(filters: CustomerFilters = {}) {
    const {
      search, status, city, neighborhood, sellerId,
      page = 1, limit = 25, orderBy = 'name', order = 'asc',
    } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(sellerId && { sellerId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { document: { contains: search.replace(/\D/g, '') } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(city && { address: { city: { contains: city, mode: 'insensitive' } } }),
      ...(neighborhood && { address: { neighborhood: { contains: neighborhood, mode: 'insensitive' } } }),
      ...(filters.isDefaulting && {
        receivables: { some: { status: 'OVERDUE', deletedAt: null } },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        include: {
          address: true,
          _count: { select: { contracts: true, receivables: true } },
        },
        orderBy: orderBy === 'name'
          ? { name: order }
          : orderBy === 'code'
          ? { code: order }
          : { createdAt: order as any },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        address: true,
        seller: { select: { id: true, name: true } },
        contracts: {
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { receivables: true } },
      },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');
    return customer;
  }

  async update(id: string, dto: Partial<CreateCustomerDto>) {
    const customer = await this.findOne(id);
    const { address, document, ...updateData } = dto;

    if (document) {
      const cleaned = document.replace(/\D/g, '');
      const exists = await this.prisma.customer.findFirst({
        where: { document: cleaned, id: { not: id }, deletedAt: null },
      });
      if (exists) throw new ConflictException('CPF/CNPJ já cadastrado para outro cliente');
      (updateData as any).document = cleaned;
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...updateData,
        address: address
          ? {
              upsert: {
                create: address,
                update: address,
              },
            }
          : undefined,
      },
      include: { address: true },
    });
  }

  async updateStatus(id: string, status: CustomerStatus, reason?: string) {
    const customer = await this.findOne(id);
    const updated = await this.prisma.customer.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, status: true },
    });

    this.webhook.send('customer.status_changed', {
      customerId: id,
      name: customer.name,
      oldStatus: customer.status,
      newStatus: status,
      reason,
    });

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    });
  }

  async exportBackup() {
    const [customers, contracts, receivables, plans] = await Promise.all([
      this.prisma.customer.findMany({
        where: { deletedAt: null },
        include: { address: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.contract.findMany({
        include: { plan: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.receivable.findMany({
        where: { deletedAt: null },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.plan.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      totals: {
        customers: customers.length,
        contracts: contracts.length,
        receivables: receivables.length,
        plans: plans.length,
      },
      plans,
      customers,
      contracts,
      receivables,
    };
  }

  async importBackup(payload: any) {
    const { plans = [], customers = [], contracts = [], receivables = [] } = payload;

    const planIdMap = new Map<string, string>();
    const customerIdMap = new Map<string, string>();
    const contractIdMap = new Map<string, string>();

    let stats = { plans: 0, customers: 0, contracts: 0, receivables: 0, skipped: 0 };

    // 1. Plans
    for (const p of plans) {
      const existing = await this.prisma.plan.findFirst({ where: { name: p.name } });
      if (existing) {
        planIdMap.set(p.id, existing.id);
      } else {
        const created = await this.prisma.plan.create({
          data: {
            name: p.name,
            downloadSpeed: p.downloadSpeed,
            uploadSpeed: p.uploadSpeed,
            monthlyPrice: p.monthlyPrice ?? p.price ?? 0,
            installFee: p.installFee ?? 0,
            fidelityMonths: p.fidelityMonths ?? 0,
            description: p.description ?? null,
            isActive: p.isActive ?? true,
          },
        });
        planIdMap.set(p.id, created.id);
        stats.plans++;
      }
    }

    // 2. Customers
    for (const c of customers) {
      const doc = (c.document ?? '').replace(/\D/g, '');
      const existing = await this.prisma.customer.findFirst({ where: { document: doc } });
      if (existing) {
        customerIdMap.set(c.id, existing.id);
        stats.skipped++;
        continue;
      }
      const { address, id: _id, createdAt, updatedAt, deletedAt, seller, _count, ...rest } = c;
      const created = await this.prisma.customer.create({
        data: {
          ...rest,
          document: doc,
          address: address ? { create: {
            street: address.street,
            number: address.number,
            complement: address.complement ?? null,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode ?? null,
          }} : undefined,
        },
      });
      customerIdMap.set(c.id, created.id);
      stats.customers++;
    }

    // 3. Contracts
    for (const ct of contracts) {
      const newCustomerId = customerIdMap.get(ct.customerId);
      const newPlanId = planIdMap.get(ct.planId) ?? ct.planId;
      if (!newCustomerId) continue;

      const existing = await this.prisma.contract.findFirst({
        where: { customerId: newCustomerId, planId: newPlanId },
      });
      if (existing) {
        contractIdMap.set(ct.id, existing.id);
        stats.skipped++;
        continue;
      }
      const { id: _id, createdAt, updatedAt, plan, customer, statusHistory, ...rest } = ct;
      const created = await this.prisma.contract.create({
        data: { ...rest, customerId: newCustomerId, planId: newPlanId },
      });
      contractIdMap.set(ct.id, created.id);
      stats.contracts++;
    }

    // 4. Receivables
    for (const r of receivables) {
      const newCustomerId = customerIdMap.get(r.customerId);
      if (!newCustomerId) continue;
      const newContractId = r.contractId ? contractIdMap.get(r.contractId) : null;

      const existing = await this.prisma.receivable.findFirst({
        where: {
          customerId: newCustomerId,
          dueDate: new Date(r.dueDate),
          description: r.description,
          deletedAt: null,
        },
      });
      if (existing) { stats.skipped++; continue; }

      const { id: _id, createdAt, updatedAt, deletedAt, customer, contract, payments, paidBy, ...rest } = r;
      await this.prisma.receivable.create({
        data: {
          ...rest,
          customerId: newCustomerId,
          contractId: newContractId ?? null,
          dueDate: new Date(r.dueDate),
          paidDate: r.paidDate ? new Date(r.paidDate) : null,
        },
      });
      stats.receivables++;
    }

    return { success: true, imported: stats };
  }

  async getFinancialSummary(id: string) {
    await this.findOne(id);

    const [totalPaid, totalPending, totalOverdue, overdueCount] = await Promise.all([
      this.prisma.receivable.aggregate({
        _sum: { paidAmount: true },
        where: { customerId: id, status: 'PAID', deletedAt: null },
      }),
      this.prisma.receivable.aggregate({
        _sum: { remainingAmount: true },
        where: { customerId: id, status: 'PENDING', deletedAt: null },
      }),
      this.prisma.receivable.aggregate({
        _sum: { remainingAmount: true },
        where: { customerId: id, status: 'OVERDUE', deletedAt: null },
      }),
      this.prisma.receivable.count({
        where: { customerId: id, status: 'OVERDUE', deletedAt: null },
      }),
    ]);

    return {
      totalPaid: Number(totalPaid._sum.paidAmount ?? 0),
      totalPending: Number(totalPending._sum.remainingAmount ?? 0),
      totalOverdue: Number(totalOverdue._sum.remainingAmount ?? 0),
      overdueCount,
    };
  }
}
