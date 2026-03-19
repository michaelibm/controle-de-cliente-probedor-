import { api } from './api';

export const payablesService = {
  async getCategories() {
    const { data } = await api.get('/payables/categories');
    return data as any[];
  },
  async createCategory(payload: { name: string; color?: string }) {
    const { data } = await api.post('/payables/categories', payload);
    return data;
  },
  async findAll(params: Record<string, any> = {}) {
    const { data } = await api.get('/payables', { params });
    return data;
  },
  async create(payload: any) {
    const { data } = await api.post('/payables', payload);
    return data;
  },
  async pay(id: string, payload: any) {
    const { data } = await api.patch(`/payables/${id}/pay`, payload);
    return data;
  },
  async cancel(id: string) {
    const { data } = await api.patch(`/payables/${id}/cancel`);
    return data;
  },
};
