import { api } from './api';

export const installationsService = {
  async findAll(params: Record<string, any> = {}) {
    const { data } = await api.get('/installations', { params });
    return data;
  },
  async getById(id: string) {
    const { data } = await api.get(`/installations/${id}`);
    return data;
  },
  async create(payload: any) {
    const { data } = await api.post('/installations', payload);
    return data;
  },
  async updateStatus(id: string, status: string) {
    const { data } = await api.patch(`/installations/${id}/status`, { status });
    return data;
  },
  async assignTechnician(id: string, technicianId: string) {
    const { data } = await api.patch(`/installations/${id}/assign`, { technicianId });
    return data;
  },
  async getTechnicians() {
    const { data } = await api.get('/installations/technicians');
    return data as { id: string; name: string; role: string }[];
  },
};
