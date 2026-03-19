import { api } from './api';
import type { Plan } from '../types/api.types';

export const plansService = {
  async findAll(params: Record<string, any> = {}): Promise<Plan[]> {
    const { data } = await api.get('/plans', { params });
    return data?.items ?? data;
  },

  async getById(id: string): Promise<Plan> {
    const { data } = await api.get(`/plans/${id}`);
    return data;
  },

  async create(payload: any): Promise<Plan> {
    const { data } = await api.post('/plans', payload);
    return data;
  },

  async update(id: string, payload: any): Promise<Plan> {
    const { data } = await api.put(`/plans/${id}`, payload);
    return data;
  },

  async toggleActive(id: string) {
    const { data } = await api.patch(`/plans/${id}/toggle`);
    return data;
  },
};
