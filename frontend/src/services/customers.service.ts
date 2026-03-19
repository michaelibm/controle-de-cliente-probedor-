import { api } from './api';
import type { Customer, PaginatedResult } from '../types/api.types';

export const customersService = {
  async findAll(params: Record<string, any> = {}): Promise<PaginatedResult<Customer>> {
    const { data } = await api.get('/customers', { params });
    return data;
  },

  async list(params: Record<string, any> = {}): Promise<PaginatedResult<Customer>> {
    return customersService.findAll(params);
  },

  async getById(id: string): Promise<Customer> {
    const { data } = await api.get(`/customers/${id}`);
    return data;
  },

  async create(payload: any): Promise<Customer> {
    const { data } = await api.post('/customers', payload);
    return data;
  },

  async update(id: string, payload: any): Promise<Customer> {
    const { data } = await api.put(`/customers/${id}`, payload);
    return data;
  },

  async updateStatus(id: string, status: string, reason?: string) {
    const { data } = await api.patch(`/customers/${id}/status`, { status, reason });
    return data;
  },

  async remove(id: string) {
    await api.delete(`/customers/${id}`);
  },

  async getFinancialSummary(id: string) {
    const { data } = await api.get(`/customers/${id}/financial-summary`);
    return data;
  },
};
