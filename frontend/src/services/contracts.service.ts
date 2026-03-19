import { api } from './api';
import type { Contract, PaginatedResult } from '../types/api.types';

export const contractsService = {
  async findAll(params: Record<string, any> = {}): Promise<PaginatedResult<Contract>> {
    const { data } = await api.get('/contracts', { params });
    return data;
  },

  async getById(id: string): Promise<Contract> {
    const { data } = await api.get(`/contracts/${id}`);
    return data;
  },

  async create(payload: any): Promise<Contract> {
    const { data } = await api.post('/contracts', payload);
    return data;
  },

  async update(id: string, payload: any): Promise<Contract> {
    const { data } = await api.put(`/contracts/${id}`, payload);
    return data;
  },

  async suspend(id: string, reason?: string) {
    const { data } = await api.patch(`/contracts/${id}/suspend`, { reason });
    return data;
  },

  async cancel(id: string, reason?: string) {
    const { data } = await api.patch(`/contracts/${id}/cancel`, { reason });
    return data;
  },

  async reactivate(id: string) {
    const { data } = await api.patch(`/contracts/${id}/reactivate`);
    return data;
  },
};
