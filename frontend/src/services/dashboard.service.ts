import { api } from './api';
import type { DashboardSummary } from '../types/api.types';

export const dashboardService = {
  async getSummary(period?: string): Promise<DashboardSummary> {
    const { data } = await api.get('/dashboard/summary', { params: { period } });
    return data;
  },

  async getRevenueChart(startDate?: string, endDate?: string) {
    const { data } = await api.get('/dashboard/revenue-chart', { params: { startDate, endDate } });
    return data;
  },

  async getMonthlyComparison() {
    const { data } = await api.get('/dashboard/monthly-comparison');
    return data;
  },

  async getStatusBreakdown() {
    const { data } = await api.get('/dashboard/status-breakdown');
    return data;
  },

  async getPaymentMethods(period?: string) {
    const { data } = await api.get('/dashboard/payment-methods', { params: { period } });
    return data;
  },

  async getTopDefaulters(limit = 10) {
    const { data } = await api.get('/dashboard/top-defaulters', { params: { limit } });
    return data;
  },

  async getUpcomingDue(days = 7) {
    const { data } = await api.get('/dashboard/upcoming-due', { params: { days } });
    return data;
  },

  async getAlerts() {
    const { data } = await api.get('/dashboard/alerts');
    return data;
  },
};
