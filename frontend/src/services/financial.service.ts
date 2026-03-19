import { api } from './api';

export const financialService = {
  async getSummary() {
    const { data } = await api.get('/financial/summary');
    return data as {
      period: { start: string; end: string };
      totalReceived: number;
      totalExpenses: number;
      totalWithdrawals: number;
      netBalance: number;
      pendingReceivables: number;
      pendingReceivablesCount: number;
      pendingPayables: number;
      pendingPayablesCount: number;
      overdueReceivablesCount: number;
      overduePayablesCount: number;
    };
  },
  async getStatement(params: Record<string, any> = {}) {
    const { data } = await api.get('/financial/statement', { params });
    return data;
  },
  async createWithdrawal(payload: { amount: number; description: string; withdrawnAt: string }) {
    const { data } = await api.post('/financial/withdrawals', payload);
    return data;
  },
  async getWithdrawals(params: Record<string, any> = {}) {
    const { data } = await api.get('/financial/withdrawals', { params });
    return data;
  },
};
