import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/auth.service';

import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { CustomersPage } from '../pages/customers/CustomersPage';
import { CustomerFormPage } from '../pages/customers/CustomerFormPage';
import { CustomerDetailPage } from '../pages/customers/CustomerDetailPage';
import { ReceivablesPage } from '../pages/receivables/ReceivablesPage';
import { ReceivableFormPage } from '../pages/receivables/ReceivableFormPage';
import { PlansPage } from '../pages/plans/PlansPage';
import { ContractsPage } from '../pages/contracts/ContractsPage';
import { ContractFormPage } from '../pages/contracts/ContractFormPage';
import { ContractDetailPage } from '../pages/contracts/ContractDetailPage';
import { FinanceiroPage } from '../pages/financeiro/FinanceiroPage';
import { InstalacoesPage } from '../pages/instalacoes/InstalacoesPage';
import { UsersPage } from '../pages/users/UsersPage';

const Placeholder = ({ title }: { title: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)' }}>{title}</div>
      <p style={{ color: 'var(--t3)', fontSize: 13, marginTop: 6 }}>Em desenvolvimento</p>
    </div>
  </div>
);

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-spin" style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '2px solid var(--bd)', borderTopColor: 'var(--accent)',
      }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }
    authService.getMe()
      .then(setUser)
      .catch(() => { localStorage.clear(); setUser(null); });
  }, [setUser, setLoading]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Clientes */}
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/new" element={<CustomerFormPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="customers/:id/edit" element={<CustomerFormPage />} />

          {/* Contratos */}
          <Route path="contracts" element={<ContractsPage />} />
          <Route path="contracts/new" element={<ContractFormPage />} />
          <Route path="contracts/:id" element={<ContractDetailPage />} />

          {/* Cobranças */}
          <Route path="receivables" element={<ReceivablesPage />} />
          <Route path="receivables/new" element={<ReceivableFormPage />} />

          {/* Planos */}
          <Route path="plans" element={<PlansPage />} />

          {/* Financeiro */}
          <Route path="financeiro" element={<FinanceiroPage />} />

          {/* Instalações */}
          <Route path="instalacoes" element={<InstalacoesPage />} />

          {/* Outros */}
          <Route path="notifications" element={<Placeholder title="Notificações" />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="settings" element={<Placeholder title="Configurações" />} />
          <Route path="reports" element={<Placeholder title="Relatórios" />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
