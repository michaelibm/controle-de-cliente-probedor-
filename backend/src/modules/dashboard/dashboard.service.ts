import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  startOfDay, endOfDay, addDays, startOfMonth, endOfMonth,
  subMonths, format, startOfYear,
} from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private resolvePeriod(period?: string): { startDate: Date; endDate: Date } {
    const today = new Date();
    switch (period) {
      case 'today':
        return { startDate: startOfDay(today), endDate: endOfDay(today) };
      case 'yesterday':
        const yesterday = addDays(today, -1);
        return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday) };
      case 'last7':
        return { startDate: startOfDay(addDays(today, -7)), endDate: endOfDay(today) };
      case 'last15':
        return { startDate: startOfDay(addDays(today, -15)), endDate: endOfDay(today) };
      case 'last30':
        return { startDate: startOfDay(addDays(today, -30)), endDate: endOfDay(today) };
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
      default: // thisMonth
        return { startDate: startOfMonth(today), endDate: endOfMonth(today) };
    }
  }

  async getSummary(period?: string) {
    const { startDate, endDate } = this.resolvePeriod(period);
    const today = startOfDay(new Date());

    const [
      totalActive,
      totalDefaulting,
      receivableMonthAgg,
      receivedMonthAgg,
      totalOverdueAgg,
      dueTodayAgg,
      dueNext7Agg,
      pendingCount,
      overdueCount,
      avgTicket,
    ] = await Promise.all([
      this.prisma.customer.count({ where: { status: 'ACTIVE', deletedAt: null } }),

      this.prisma.customer.count({
        where: { deletedAt: null, receivables: { some: { status: 'OVERDUE', deletedAt: null } } },
      }),

      this.prisma.receivable.aggregate({
        _sum: { remainingAmount: true },
        where: { deletedAt: null, status: { in: ['PENDING', 'OVERDUE'] }, dueDate: { gte: startDate, lte: endDate } },
      }),

      this.prisma.receivable.aggregate({
        _sum: { paidAmount: true },
        where: { deletedAt: null, status: 'PAID', paidDate: { gte: startDate, lte: endDate } },
      }),

      this.prisma.receivable.aggregate({
        _sum: { remainingAmount: true },
        where: { deletedAt: null, status: 'OVERDUE' },
      }),

      this.prisma.receivable.aggregate({
        _sum: { finalAmount: true },
        where: { deletedAt: null, status: 'PENDING', dueDate: { gte: today, lt: addDays(today, 1) } },
      }),

      this.prisma.receivable.aggregate({
        _sum: { finalAmount: true },
        where: { deletedAt: null, status: 'PENDING', dueDate: { gte: today, lt: addDays(today, 7) } },
      }),

      this.prisma.receivable.count({ where: { deletedAt: null, status: 'PENDING' } }),
      this.prisma.receivable.count({ where: { deletedAt: null, status: 'OVERDUE' } }),

      this.prisma.receivable.aggregate({
        _avg: { paidAmount: true },
        where: { deletedAt: null, status: 'PAID', paidDate: { gte: startDate, lte: endDate } },
      }),
    ]);

    const receivableMonth = Number(receivableMonthAgg._sum.remainingAmount ?? 0);
    const receivedMonth = Number(receivedMonthAgg._sum.paidAmount ?? 0);
    const total = receivableMonth + receivedMonth;

    return {
      totalActiveCustomers: totalActive,
      totalDefaultingCustomers: totalDefaulting,
      defaultRate: totalActive > 0 ? +((totalDefaulting / totalActive) * 100).toFixed(2) : 0,
      totalReceivableMonth: receivableMonth,
      totalReceivedMonth: receivedMonth,
      totalOverdue: Number(totalOverdueAgg._sum.remainingAmount ?? 0),
      totalDueToday: Number(dueTodayAgg._sum.finalAmount ?? 0),
      totalDueNext7Days: Number(dueNext7Agg._sum.finalAmount ?? 0),
      pendingInvoicesCount: pendingCount,
      overdueInvoicesCount: overdueCount,
      averageTicket: +(Number(avgTicket._avg.paidAmount ?? 0)).toFixed(2),
      collectionRate: total > 0 ? +((receivedMonth / total) * 100).toFixed(2) : 0,
    };
  }

  async getRevenueChart(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : startOfMonth(new Date());
    const end = endDate ? new Date(endDate) : endOfMonth(new Date());

    const result = await this.prisma.$queryRaw<Array<{ date: Date; total: number }>>`
      SELECT
        DATE_TRUNC('day', paid_date)::date as date,
        COALESCE(SUM(paid_amount), 0) as total
      FROM receivables
      WHERE
        deleted_at IS NULL
        AND status = 'PAID'
        AND paid_date >= ${start}
        AND paid_date <= ${end}
      GROUP BY DATE_TRUNC('day', paid_date)
      ORDER BY date ASC
    `;

    return result.map(r => ({
      date: format(new Date(r.date), 'dd/MM'),
      total: Number(r.total),
    }));
  }

  async getMonthlyComparison() {
    const year = new Date().getFullYear();

    const result = await this.prisma.$queryRaw<
      Array<{ month: number; received: number; expected: number }>
    >`
      SELECT
        EXTRACT(MONTH FROM due_date)::int as month,
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN paid_amount ELSE 0 END), 0) as received,
        COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN final_amount ELSE 0 END), 0) as expected
      FROM receivables
      WHERE
        deleted_at IS NULL
        AND EXTRACT(YEAR FROM due_date) = ${year}
      GROUP BY EXTRACT(MONTH FROM due_date)
      ORDER BY month ASC
    `;

    return result.map(r => ({
      month: r.month,
      received: Number(r.received),
      expected: Number(r.expected),
    }));
  }

  async getStatusBreakdown() {
    const groups = await this.prisma.receivable.groupBy({
      by: ['status'],
      _count: true,
      _sum: { finalAmount: true },
      where: { deletedAt: null },
    });
    return groups.map(g => ({
      status: g.status,
      count: g._count,
      total: Number(g._sum.finalAmount ?? 0),
    }));
  }

  async getPaymentMethodBreakdown(period?: string) {
    const { startDate, endDate } = this.resolvePeriod(period);
    const groups = await this.prisma.receivable.groupBy({
      by: ['paymentMethod'],
      _count: true,
      _sum: { paidAmount: true },
      where: {
        deletedAt: null,
        status: 'PAID',
        paidDate: { gte: startDate, lte: endDate },
        paymentMethod: { not: null },
      },
    });
    return groups.map(g => ({
      method: g.paymentMethod,
      count: g._count,
      total: Number(g._sum.paidAmount ?? 0),
    }));
  }

  async getTopDefaulters(limit = 10) {
    const result = await this.prisma.$queryRaw<Array<{
      id: string; name: string; document: string;
      overdueCount: number; overdueAmount: number; maxDaysOverdue: number;
    }>>`
      SELECT
        c.id,
        c.name,
        c.document,
        COUNT(r.id)::int as "overdueCount",
        COALESCE(SUM(r.remaining_amount), 0) as "overdueAmount",
        COALESCE(MAX(CURRENT_DATE - r.due_date::date), 0) as "maxDaysOverdue"
      FROM customers c
      JOIN receivables r ON r.customer_id = c.id
      WHERE
        c.deleted_at IS NULL
        AND r.deleted_at IS NULL
        AND r.status = 'OVERDUE'
      GROUP BY c.id, c.name, c.document
      ORDER BY "overdueAmount" DESC
      LIMIT ${limit}
    `;

    return result.map(r => ({
      ...r,
      overdueAmount: Number(r.overdueAmount),
    }));
  }

  async getUpcomingDue(days = 7) {
    const today = startOfDay(new Date());
    return this.prisma.receivable.findMany({
      where: {
        deletedAt: null,
        status: 'PENDING',
        dueDate: { gte: today, lt: addDays(today, days) },
      },
      include: {
        customer: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    });
  }

  async getAlerts() {
    const today = startOfDay(new Date());
    const alerts: any[] = [];

    const [dueTodayCount, overdueCount, payableDueCount] = await Promise.all([
      this.prisma.receivable.count({
        where: { deletedAt: null, status: 'PENDING', dueDate: { gte: today, lt: addDays(today, 1) } },
      }),
      this.prisma.receivable.count({
        where: { deletedAt: null, status: 'OVERDUE' },
      }),
      this.prisma.payable.count({
        where: { deletedAt: null, status: 'PENDING', dueDate: { lte: addDays(today, 3) } },
      }),
    ]);

    if (dueTodayCount > 0) alerts.push({ type: 'DUE_TODAY', message: `${dueTodayCount} cobrança(s) vencem hoje`, priority: 'HIGH' });
    if (overdueCount > 0) alerts.push({ type: 'OVERDUE', message: `${overdueCount} cobrança(s) em atraso`, priority: 'CRITICAL' });
    if (payableDueCount > 0) alerts.push({ type: 'PAYABLE_DUE', message: `${payableDueCount} conta(s) a pagar vencendo em breve`, priority: 'MEDIUM' });

    return alerts;
  }
}
