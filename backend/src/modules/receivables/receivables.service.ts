import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import {
  ReceivableStatus, PaymentMethod, ReceivableType, Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';
import { AsaasService } from '../asaas/asaas.service';
import {
  CreateReceivableDto, PayReceivableDto, RenegotiateReceivableDto, FilterReceivableDto,
} from './dto/create-receivable.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { startOfDay, endOfDay, addDays, addMonths, format } from 'date-fns';

@Injectable()
export class ReceivablesService {
  constructor(
    private prisma: PrismaService,
    private webhook: WebhookService,
    private asaas: AsaasService,
  ) {}

  private async generateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.receivable.count({
      where: { code: { startsWith: `FAT-${year}` } },
    });
    return `FAT-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  async create(dto: CreateReceivableDto) {
    const code = await this.generateCode();
    const finalAmount = dto.principalAmount - (dto.discount ?? 0);

    const receivable = await this.prisma.receivable.create({
      data: {
        code,
        customerId: dto.customerId,
        contractId: dto.contractId,
        description: dto.description,
        type: dto.type ?? ReceivableType.MONTHLY,
        status: ReceivableStatus.PENDING,
        principalAmount: dto.principalAmount,
        discount: dto.discount ?? 0,
        finalAmount,
        remainingAmount: finalAmount,
        dueDate: new Date(dto.dueDate),
        notes: dto.notes,
      },
      include: {
        customer: { select: { id: true, name: true, document: true, email: true, phone: true, whatsapp: true } },
        contract: { select: { id: true, number: true } },
      },
    });

    // Criar cobrança no Asaas (não bloqueia em caso de erro)
    if (receivable.customer) {
      await this.syncAsaas(receivable.id, receivable.customer, Number(finalAmount), new Date(dto.dueDate), dto.description);
    }

    return this.prisma.receivable.findFirst({
      where: { id: receivable.id },
      include: {
        customer: { select: { id: true, name: true } },
        contract: { select: { id: true, number: true } },
      },
    });
  }

  private async syncAsaas(
    receivableId: string,
    customer: { id: string; name: string; document: string; email?: string | null; phone?: string | null; whatsapp?: string | null },
    value: number,
    dueDate: Date,
    description: string,
  ): Promise<void> {
    try {
      const asaasCustomerId = await this.asaas.findOrCreateCustomer({
        name: customer.name,
        cpfCnpj: customer.document,
        email: customer.email,
        phone: customer.whatsapp || customer.phone,
      });

      // Salvar asaasCustomerId no cliente
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { asaasCustomerId },
      });

      const charge = await this.asaas.createCharge({
        asaasCustomerId,
        value,
        dueDate,
        description,
        externalReference: receivableId,
      });

      const pix = await this.asaas.getPixQrCode(charge.id);

      await this.prisma.receivable.update({
        where: { id: receivableId },
        data: {
          asaasId: charge.id,
          paymentLink: charge.invoiceUrl,
          boletoUrl: charge.bankSlipUrl,
          pixQrCode: pix?.encodedImage ?? null,
          pixCopiaECola: pix?.payload ?? null,
        },
      });
    } catch (err: any) {
      // Não propaga o erro — a cobrança local é preservada
      console.error(`[Asaas] Erro ao sincronizar cobrança ${receivableId}: ${err?.message}`);
    }
  }

  async findAll(filters: FilterReceivableDto & { page?: number; limit?: number; orderBy?: string; order?: string } = {}) {
    const { page = 1, limit = 25 } = filters;
    const skip = (page - 1) * limit;
    const today = startOfDay(new Date());

    const statusList = filters.status
      ? (filters.status.split(',') as ReceivableStatus[])
      : undefined;

    const where: Prisma.ReceivableWhereInput = {
      deletedAt: null,
      ...(statusList && { status: { in: statusList } }),
      ...(filters.customerId && { customerId: filters.customerId }),
      ...(filters.contractId && { contractId: filters.contractId }),
      ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod as PaymentMethod }),
      ...(filters.planId && { contract: { planId: filters.planId } }),
      ...(filters.search && {
        OR: [
          { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
          { customer: { document: { contains: filters.search.replace(/\D/g, '') } } },
          { code: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
      ...(filters.city && {
        customer: { address: { city: { contains: filters.city, mode: 'insensitive' } } },
      }),
      ...(filters.dueDateStart || filters.dueDateEnd ? {
        dueDate: {
          ...(filters.dueDateStart && { gte: new Date(filters.dueDateStart) }),
          ...(filters.dueDateEnd && { lte: new Date(filters.dueDateEnd) }),
        },
      } : {}),
      ...(filters.paidDateStart || filters.paidDateEnd ? {
        paidDate: {
          ...(filters.paidDateStart && { gte: new Date(filters.paidDateStart) }),
          ...(filters.paidDateEnd && { lte: new Date(filters.paidDateEnd) }),
        },
      } : {}),
      ...(filters.minAmount !== undefined || filters.maxAmount !== undefined ? {
        finalAmount: {
          ...(filters.minAmount !== undefined && { gte: filters.minAmount }),
          ...(filters.maxAmount !== undefined && { lte: filters.maxAmount }),
        },
      } : {}),
      ...(filters.dueToday && {
        dueDate: { gte: today, lt: addDays(today, 1) },
        status: ReceivableStatus.PENDING,
      }),
      ...(filters.dueThisWeek && {
        dueDate: { gte: today, lt: addDays(today, 7) },
        status: ReceivableStatus.PENDING,
      }),
      ...(filters.paidToday && {
        paidDate: { gte: today, lt: addDays(today, 1) },
        status: ReceivableStatus.PAID,
      }),
    };

    const [items, total, meta] = await Promise.all([
      this.prisma.receivable.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, name: true, document: true } },
          contract: { select: { id: true, number: true, plan: { select: { name: true } } } },
        },
        orderBy: filters.orderBy === 'amount'
          ? { finalAmount: (filters.order as any) || 'desc' }
          : { dueDate: (filters.order as any) || 'asc' },
      }),
      this.prisma.receivable.count({ where }),
      this.getListMeta(),
    ]);

    const result = paginate(items, total, page, limit);
    return { ...result, meta };
  }

  private async getListMeta() {
    const today = startOfDay(new Date());
    const [dueToday, overdue, paidToday, totalPending] = await Promise.all([
      this.prisma.receivable.count({
        where: { deletedAt: null, status: 'PENDING', dueDate: { gte: today, lt: addDays(today, 1) } },
      }),
      this.prisma.receivable.aggregate({
        _sum: { remainingAmount: true },
        _count: true,
        where: { deletedAt: null, status: 'OVERDUE' },
      }),
      this.prisma.receivable.aggregate({
        _sum: { paidAmount: true },
        where: { deletedAt: null, status: 'PAID', paidDate: { gte: today } },
      }),
      this.prisma.receivable.aggregate({
        _sum: { remainingAmount: true },
        where: { deletedAt: null, status: { in: ['PENDING', 'OVERDUE'] } },
      }),
    ]);
    return {
      dueToday,
      overdueCount: overdue._count,
      overdueAmount: Number(overdue._sum.remainingAmount ?? 0),
      paidToday: Number(paidToday._sum.paidAmount ?? 0),
      totalPending: Number(totalPending._sum.remainingAmount ?? 0),
    };
  }

  async findOne(id: string) {
    const receivable = await this.prisma.receivable.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: { include: { address: true } },
        contract: { include: { plan: true } },
        payments: {
          include: { registeredByUser: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        originalReceivable: { select: { id: true, code: true, dueDate: true, principalAmount: true } },
        renegotiations: { select: { id: true, code: true, dueDate: true, finalAmount: true, status: true } },
      },
    });
    if (!receivable) throw new NotFoundException('Cobrança não encontrada');
    return receivable;
  }

  async pay(id: string, dto: PayReceivableDto, userId: string) {
    const receivable = await this.findOne(id);

    const nonPayableStatuses: string[] = [ReceivableStatus.CANCELLED, ReceivableStatus.RENEGOTIATED, ReceivableStatus.EXEMPT];
    if (nonPayableStatuses.includes(receivable.status)) {
      throw new BadRequestException(`Cobrança com status "${receivable.status}" não pode ser baixada`);
    }

    const isPartial = dto.amount < Number(receivable.remainingAmount);
    const newPaidAmount = Number(receivable.paidAmount) + dto.amount;
    const newRemainingAmount = Number(receivable.finalAmount) - newPaidAmount;
    const newStatus = newRemainingAmount <= 0
      ? ReceivableStatus.PAID
      : ReceivableStatus.PARTIAL;

    return this.prisma.$transaction(async (tx) => {
      await tx.receivablePayment.create({
        data: {
          receivableId: id,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          paidAt: new Date(dto.paidAt),
          notes: dto.notes,
          receiptUrl: dto.receiptUrl,
          registeredBy: userId,
        },
      });

      const updated = await tx.receivable.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: Math.max(0, newRemainingAmount),
          status: newStatus,
          paidDate: newStatus === ReceivableStatus.PAID ? new Date(dto.paidAt) : null,
          paymentMethod: newStatus === ReceivableStatus.PAID ? dto.paymentMethod : receivable.paymentMethod,
        },
        include: { customer: { select: { id: true, name: true, phone: true, whatsapp: true } } },
      });

      this.webhook.send('payment.received', {
        receivableId: id,
        code: receivable.code,
        customerId: receivable.customerId,
        customerName: updated.customer?.name,
        customerPhone: updated.customer?.whatsapp || updated.customer?.phone,
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        dueDate: receivable.dueDate,
        paidDate: dto.paidAt,
        status: newStatus,
        description: receivable.description,
      });

      return updated;
    });
  }

  async cancel(id: string, reason?: string) {
    const receivable = await this.findOne(id);
    if (receivable.status === ReceivableStatus.PAID) {
      throw new BadRequestException('Cobrança paga não pode ser cancelada');
    }

    // Cancelar no Asaas se existir
    if (receivable.asaasId) {
      void this.asaas.cancelCharge(receivable.asaasId);
    }

    return this.prisma.receivable.update({
      where: { id },
      data: { status: ReceivableStatus.CANCELLED, notes: reason ?? receivable.notes },
    });
  }

  async renegotiate(id: string, dto: RenegotiateReceivableDto) {
    const original = await this.findOne(id);
    if (original.status === ReceivableStatus.PAID) {
      throw new BadRequestException('Cobrança paga não pode ser renegociada');
    }

    // Cancelar cobrança original no Asaas
    if (original.asaasId) {
      void this.asaas.cancelCharge(original.asaasId);
    }

    const code = await this.generateCode();
    const newAmount = dto.newAmount - (dto.discount ?? 0);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.receivable.update({
        where: { id },
        data: { status: ReceivableStatus.RENEGOTIATED, notes: dto.reason },
      });

      return tx.receivable.create({
        data: {
          code,
          customerId: original.customerId,
          contractId: original.contractId,
          description: `Renegociação - ${original.description}`,
          type: ReceivableType.RENEGOTIATED,
          status: ReceivableStatus.PENDING,
          principalAmount: dto.newAmount,
          discount: dto.discount ?? 0,
          finalAmount: newAmount,
          remainingAmount: newAmount,
          dueDate: new Date(dto.newDueDate),
          originalReceivableId: id,
          notes: dto.reason,
        },
        include: {
          customer: { select: { id: true, name: true, document: true, email: true, phone: true, whatsapp: true } },
        },
      });
    });

    // Criar nova cobrança no Asaas para a renegociação
    if (result.customer) {
      void this.syncAsaas(
        result.id,
        result.customer,
        newAmount,
        new Date(dto.newDueDate),
        `Renegociação - ${original.description}`,
      );
    }

    return result;
  }

  async updateDueDate(id: string, newDueDate: string) {
    await this.findOne(id);
    return this.prisma.receivable.update({
      where: { id },
      data: { dueDate: new Date(newDueDate) },
    });
  }

  async update(id: string, dto: { description?: string; principalAmount?: number; discount?: number; dueDate?: string }) {
    const receivable = await this.findOne(id);

    const nonEditable: ReceivableStatus[] = [ReceivableStatus.PAID, ReceivableStatus.CANCELLED, ReceivableStatus.RENEGOTIATED];
    if (nonEditable.includes(receivable.status)) {
      throw new BadRequestException('Cobrança com este status não pode ser editada');
    }

    const principal = dto.principalAmount !== undefined ? dto.principalAmount : Number(receivable.principalAmount);
    const discount = dto.discount !== undefined ? dto.discount : Number(receivable.discount);
    const finalAmount = principal - discount;
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;

    const updated = await this.prisma.receivable.update({
      where: { id },
      data: {
        ...(dto.description && { description: dto.description }),
        ...(dto.principalAmount !== undefined && { principalAmount: principal }),
        ...(dto.discount !== undefined && { discount }),
        ...(dto.principalAmount !== undefined || dto.discount !== undefined
          ? { finalAmount, remainingAmount: finalAmount }
          : {}),
        ...(dueDate && { dueDate }),
      },
      include: { customer: { select: { id: true, name: true } } },
    });

    if (receivable.asaasId) {
      void this.asaas.updatePayment(receivable.asaasId, {
        ...(dto.principalAmount !== undefined || dto.discount !== undefined ? { value: finalAmount } : {}),
        ...(dueDate ? { dueDate } : {}),
        ...(dto.description ? { description: dto.description } : {}),
      }).catch((err) => console.error(`[Asaas] Erro ao atualizar cobrança: ${err?.message}`));
    }

    return updated;
  }

  async syncWithAsaas(): Promise<{ synced: number; errors: number }> {
    const receivables = await this.prisma.receivable.findMany({
      where: {
        deletedAt: null,
        asaasId: { not: null },
        status: { in: [ReceivableStatus.PENDING, ReceivableStatus.OVERDUE, ReceivableStatus.PARTIAL] },
      },
      include: { customer: { select: { id: true } } },
    });

    let synced = 0;
    let errors = 0;

    for (const receivable of receivables) {
      try {
        const payment = await this.asaas.getPaymentStatus(receivable.asaasId!);
        if (!payment) continue;

        const isConfirmed = ['RECEIVED', 'CONFIRMED'].includes(payment.status);
        if (!isConfirmed) continue;

        const paidValue = Number(payment.value ?? receivable.finalAmount);
        const paidAt = payment.paymentDate ? new Date(payment.paymentDate) : new Date();

        const paymentMethodMap: Record<string, any> = {
          PIX: 'PIX', BOLETO: 'BOLETO', CREDIT_CARD: 'CREDIT_CARD',
          DEBIT_CARD: 'DEBIT_CARD', TRANSFER: 'TRANSFER',
        };
        const paymentMethod = paymentMethodMap[payment.billingType] ?? 'BOLETO';

        const systemUser = await this.prisma.user.findFirst({
          where: { role: 'ADMIN', isActive: true },
          select: { id: true },
        });

        await this.prisma.$transaction(async (tx) => {
          if (systemUser) {
            const alreadyRegistered = await tx.receivablePayment.findFirst({
              where: { receivableId: receivable.id, notes: { contains: 'Asaas sync' } },
            });
            if (!alreadyRegistered) {
              await tx.receivablePayment.create({
                data: {
                  receivableId: receivable.id,
                  amount: paidValue,
                  paymentMethod,
                  paidAt,
                  notes: `Asaas sync automático (${payment.billingType ?? 'BOLETO'})`,
                  registeredBy: systemUser.id,
                },
              });
            }
          }
          await tx.receivable.update({
            where: { id: receivable.id },
            data: {
              paidAmount: paidValue,
              remainingAmount: 0,
              status: ReceivableStatus.PAID,
              paidDate: paidAt,
              paymentMethod,
            },
          });
        });

        synced++;
      } catch (err: any) {
        console.error(`[Asaas Sync] Erro ao sincronizar ${receivable.asaasId}: ${err?.message}`);
        errors++;
      }
    }

    console.log(`[Asaas Sync] Concluído: ${synced} sincronizados, ${errors} erros`);
    return { synced, errors };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.receivable.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { deleted: 1 };
  }

  async removeMany(ids: string[]) {
    const result = await this.prisma.receivable.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return { deleted: result.count };
  }

  async markOverdue() {
    const today = startOfDay(new Date());
    const result = await this.prisma.receivable.updateMany({
      where: {
        status: ReceivableStatus.PENDING,
        dueDate: { lt: today },
        deletedAt: null,
      },
      data: { status: ReceivableStatus.OVERDUE },
    });
    return result.count;
  }

  async generateMonthly() {
    const activeContracts = await this.prisma.contract.findMany({
      where: { status: 'ACTIVE' },
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthStr = format(now, 'MM/yyyy');
    let created = 0;

    for (const contract of activeContracts) {
      const dueDate = new Date(year, month, contract.dueDay);
      const exists = await this.prisma.receivable.findFirst({
        where: {
          contractId: contract.id,
          description: { contains: monthStr },
          deletedAt: null,
        },
      });
      if (exists) continue;

      const code = await this.generateCode();
      const discount = Number(contract.discount);
      const principal = Number(contract.monthlyValue);
      const final = principal - discount;
      const description = `Mensalidade ${monthStr}`;

      const receivable = await this.prisma.receivable.create({
        data: {
          code,
          customerId: contract.customerId,
          contractId: contract.id,
          description,
          type: ReceivableType.MONTHLY,
          status: ReceivableStatus.PENDING,
          principalAmount: principal,
          discount,
          finalAmount: final,
          remainingAmount: final,
          dueDate,
          issueDate: new Date(),
        },
        include: {
          customer: { select: { id: true, name: true, document: true, email: true, phone: true, whatsapp: true } },
        },
      });

      if (receivable.customer) {
        void this.syncAsaas(receivable.id, receivable.customer, final, dueDate, description);
      }

      created++;
    }
    return { created };
  }

  async generateAnnual(contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });
    if (!contract) throw new NotFoundException('Contrato não encontrado');

    const now = new Date();
    let created = 0;
    let skipped = 0;

    for (let i = 0; i < 12; i++) {
      const targetDate = addMonths(now, i);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const monthStr = format(targetDate, 'MM/yyyy');

      const dueDate = new Date(year, month, contract.dueDay);

      const exists = await this.prisma.receivable.findFirst({
        where: {
          contractId: contract.id,
          description: { contains: monthStr },
          deletedAt: null,
        },
      });
      if (exists) { skipped++; continue; }

      const code = await this.generateCode();
      const discount = Number(contract.discount);
      const principal = Number(contract.monthlyValue);
      const final = principal - discount;
      const description = `Mensalidade ${monthStr}`;

      const receivable = await this.prisma.receivable.create({
        data: {
          code,
          customerId: contract.customerId,
          contractId: contract.id,
          description,
          type: ReceivableType.MONTHLY,
          status: ReceivableStatus.PENDING,
          principalAmount: principal,
          discount,
          finalAmount: final,
          remainingAmount: final,
          dueDate,
          issueDate: new Date(),
        },
        include: {
          customer: { select: { id: true, name: true, document: true, email: true, phone: true, whatsapp: true } },
        },
      });

      if (receivable.customer) {
        void this.syncAsaas(receivable.id, receivable.customer, final, dueDate, description);
      }

      created++;
    }
    return { created, skipped };
  }
}
