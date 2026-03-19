import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class FinancialService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);

    const [
      receivedAgg,
      paidExpensesAgg,
      pendingReceivablesAgg,
      pendingPayablesAgg,
      overdueReceivablesAgg,
      overduePayablesAgg,
      cashWithdrawalsAgg,
    ] = await Promise.all([
      this.prisma.receivable.aggregate({
        _sum: { paidAmount: true },
        where: { deletedAt: null, status: 'PAID', paidDate: { gte: startDate, lte: endDate } },
      }),
      this.prisma.payable.aggregate({
        _sum: { amount: true },
        where: { deletedAt: null, status: 'PAID', paidDate: { gte: startDate, lte: endDate } },
      }),
      this.prisma.receivable.aggregate({
        _sum: { remainingAmount: true },
        _count: true,
        where: { deletedAt: null, status: { in: ['PENDING', 'OVERDUE'] } },
      }),
      this.prisma.payable.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { deletedAt: null, status: { in: ['PENDING', 'OVERDUE'] } },
      }),
      this.prisma.receivable.aggregate({
        _sum: { remainingAmount: true },
        _count: true,
        where: { deletedAt: null, status: 'OVERDUE' },
      }),
      this.prisma.payable.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { deletedAt: null, status: 'OVERDUE' },
      }),
      this.prisma.cashWithdrawal.aggregate({
        _sum: { amount: true },
        where: { withdrawnAt: { gte: startDate, lte: endDate } },
      }),
    ]);

    const totalReceived = Number(receivedAgg._sum.paidAmount ?? 0);
    const totalExpenses = Number(paidExpensesAgg._sum.amount ?? 0);
    const totalWithdrawals = Number(cashWithdrawalsAgg._sum.amount ?? 0);

    return {
      period: { start: format(startDate, 'dd/MM/yyyy'), end: format(endDate, 'dd/MM/yyyy') },
      totalReceived,
      totalExpenses,
      totalWithdrawals,
      netBalance: totalReceived - totalExpenses - totalWithdrawals,
      pendingReceivables: Number(pendingReceivablesAgg._sum.remainingAmount ?? 0),
      pendingReceivablesCount: pendingReceivablesAgg._count,
      pendingPayables: Number(pendingPayablesAgg._sum.amount ?? 0),
      pendingPayablesCount: pendingPayablesAgg._count,
      overdueReceivablesCount: overdueReceivablesAgg._count,
      overduePayablesCount: overduePayablesAgg._count,
    };
  }

  async getStatement(filters: {
    startDate?: string;
    endDate?: string;
    type?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 40 } = filters;
    const startDate = filters.startDate ? new Date(filters.startDate) : startOfMonth(new Date());
    const endDate = filters.endDate ? new Date(filters.endDate) : endOfMonth(new Date());

    const entries: Array<{
      id: string; date: Date; description: string;
      amount: number; type: string; reference?: string; paymentMethod?: string | null;
    }> = [];

    if (!filters.type || filters.type === 'income') {
      const paid = await this.prisma.receivable.findMany({
        where: { deletedAt: null, status: 'PAID', paidDate: { gte: startDate, lte: endDate } },
        include: { customer: { select: { name: true } } },
      });
      for (const r of paid) {
        entries.push({
          id: r.id, date: r.paidDate!, type: 'income', reference: r.code,
          description: `${r.description} · ${r.customer?.name ?? ''}`,
          amount: Number(r.paidAmount), paymentMethod: r.paymentMethod,
        });
      }
    }

    if (!filters.type || filters.type === 'expense') {
      const paid = await this.prisma.payable.findMany({
        where: { deletedAt: null, status: 'PAID', paidDate: { gte: startDate, lte: endDate } },
        include: { category: { select: { name: true } } },
      });
      for (const p of paid) {
        entries.push({
          id: p.id, date: p.paidDate!, type: 'expense', reference: p.code,
          description: `${p.description} · ${p.supplier}`,
          amount: Number(p.amount), paymentMethod: p.paymentMethod,
        });
      }
    }

    if (!filters.type || filters.type === 'withdrawal') {
      const withdrawals = await this.prisma.cashWithdrawal.findMany({
        where: { withdrawnAt: { gte: startDate, lte: endDate } },
      });
      for (const w of withdrawals) {
        entries.push({
          id: w.id, date: w.withdrawnAt, type: 'withdrawal', reference: w.code,
          description: `Retirada · ${w.description}`,
          amount: Number(w.amount), paymentMethod: null,
        });
      }
    }

    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = entries.length;
    const skip = (page - 1) * limit;
    const items = entries.slice(skip, skip + limit);
    return paginate(items, total, page, limit);
  }

  async createWithdrawal(dto: { amount: number; description: string; withdrawnAt: string }) {
    const year = new Date().getFullYear();
    const count = await this.prisma.cashWithdrawal.count({
      where: { code: { startsWith: `RET-${year}` } },
    });
    const code = `RET-${year}-${String(count + 1).padStart(5, '0')}`;
    return this.prisma.cashWithdrawal.create({
      data: {
        code, amount: dto.amount, description: dto.description,
        withdrawnAt: new Date(dto.withdrawnAt), withdrawnBy: 'user',
      },
    });
  }

  async getWithdrawals(filters: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 25 } = filters;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.cashWithdrawal.findMany({ skip, take: limit, orderBy: { withdrawnAt: 'desc' } }),
      this.prisma.cashWithdrawal.count(),
    ]);
    return paginate(items, total, page, limit);
  }
}
