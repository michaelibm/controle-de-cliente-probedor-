import { api } from './api';

export type UserRole = 'ADMIN' | 'FINANCIAL' | 'ATTENDANT' | 'SUPPORT' | 'INSTALLER';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export const usersService = {
  async findAll(page = 1, limit = 25) {
    const { data } = await api.get('/users', { params: { page, limit } });
    return data;
  },

  async create(payload: { name: string; email: string; password: string; role?: UserRole }) {
    const { data } = await api.post('/users', payload);
    return data as AppUser;
  },

  async update(id: string, payload: { name?: string; email?: string; password?: string; role?: UserRole }) {
    const { data } = await api.put(`/users/${id}`, payload);
    return data as AppUser;
  },

  async toggle(id: string) {
    const { data } = await api.patch(`/users/${id}/toggle`);
    return data as AppUser;
  },
};
