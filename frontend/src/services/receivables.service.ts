import { api } from './api';
import type { Receivable, PaginatedResult } from '../types/api.types';

export const receivablesService = {
  async findAll(params: Record<string, any> = {}): Promise<PaginatedResult<Receivable>> {
    const { data } = await api.get('/receivables', { params });
    return data;
  },

  async list(params: Record<string, any> = {}): Promise<PaginatedResult<Receivable>> {
    return receivablesService.findAll(params);
  },

  async getById(id: string): Promise<Receivable> {
    const { data } = await api.get(`/receivables/${id}`);
    return data;
  },

  async create(payload: any): Promise<Receivable> {
    const { data } = await api.post('/receivables', payload);
    return data;
  },

  async pay(id: string, payload: any): Promise<Receivable> {
    const { data } = await api.patch(`/receivables/${id}/pay`, payload);
    return data;
  },

  async cancel(id: string, reason?: string): Promise<Receivable> {
    const { data } = await api.patch(`/receivables/${id}/cancel`, { reason });
    return data;
  },

  async renegotiate(id: string, payload: any): Promise<Receivable> {
    const { data } = await api.patch(`/receivables/${id}/renegotiate`, payload);
    return data;
  },

  async updateDueDate(id: string, newDueDate: string): Promise<Receivable> {
    const { data } = await api.patch(`/receivables/${id}/due-date`, { newDueDate });
    return data;
  },

  async generateMonthly() {
    const { data } = await api.post('/receivables/generate-monthly');
    return data;
  },

  async generateAnnual(contractId: string) {
    const { data } = await api.post(`/receivables/generate-annual/${contractId}`);
    return data;
  },

  async update(id: string, payload: { description?: string; principalAmount?: number; discount?: number; dueDate?: string }): Promise<Receivable> {
    const { data } = await api.patch(`/receivables/${id}`, payload);
    return data;
  },

  async syncWithAsaas(): Promise<{ synced: number; errors: number }> {
    const { data } = await api.post('/receivables/sync');
    return data;
  },

  async remove(id: string): Promise<{ deleted: number }> {
    const { data } = await api.delete(`/receivables/${id}`);
    return data;
  },

  async removeMany(ids: string[]): Promise<{ deleted: number }> {
    const { data } = await api.delete('/receivables/bulk', { data: { ids } });
    return data;
  },
};
