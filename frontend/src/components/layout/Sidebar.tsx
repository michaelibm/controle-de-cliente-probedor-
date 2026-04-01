import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Package, DollarSign,
  CreditCard, Bell, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '../../utils/formatters';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers', icon: Users, label: 'Clientes' },
  { to: '/contracts', icon: FileText, label: 'Contratos' },
  { to: '/plans', icon: Package, label: 'Planos' },
  { to: '/receivables', icon: DollarSign, label: 'Contas a Receber' },
  { to: '/payables', icon: CreditCard, label: 'Contas a Pagar' },
  { to: '/reports', icon: BarChart3, label: 'Relatórios' },
  { to: '/notifications', icon: Bell, label: 'Alertas' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    logout();
    navigate('/login');
  };

  return (
    <aside
      style={{
        display: 'flex', flexDirection: 'column', height: '100vh',
        background: '#FFFFFF',
        borderRight: '1px solid rgba(0,0,0,0.08)',
        width: collapsed ? 64 : 240,
        transition: 'width 0.3s ease',
        position: 'relative', flexShrink: 0,
        boxShadow: '2px 0 12px rgba(0,0,0,0.05)',
      }}
    >
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10, padding: collapsed ? '16px 0' : '14px 16px',
        borderBottom: '1px solid rgba(0,0,0,0.07)', minHeight: 68,
      }}>
        {collapsed ? (
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(145deg, #D0D3D8, #B8BCC4)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            overflow: 'hidden', flexShrink: 0,
          }}>
            <img src="/pwa-icon.svg" alt="NFT" style={{ width: '100%', height: '100%' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'linear-gradient(145deg, #D0D3D8, #B8BCC4)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              overflow: 'hidden', flexShrink: 0,
            }}>
              <img src="/pwa-icon.svg" alt="NFT" style={{ width: '100%', height: '100%' }} />
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--t1)', fontStyle: 'italic', lineHeight: 1.1, letterSpacing: -0.3 }}>
                <span style={{ color: 'var(--accent)' }}>NFT</span> TELECOM
              </p>
              <p style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: 0.3 }}>Gestão de Provedor</p>
            </div>
          </div>
        )}
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute', right: -12, top: 22,
          width: 24, height: 24, borderRadius: '50%',
          background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.12)',
          color: 'var(--t3)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', zIndex: 10,
          boxShadow: '0 2px 6px rgba(0,0,0,0.10)',
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center',
              gap: collapsed ? 0 : 10,
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '10px 0' : '10px 12px',
              borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 500,
              transition: 'all 0.15s',
              background: isActive ? 'rgba(24,194,74,0.10)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--t2)',
              borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
            })}
          >
            <Icon size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', padding: '10px 8px' }}>
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sair' : undefined}
          style={{
            display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px 0' : '10px 12px',
            width: '100%', borderRadius: 10,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--t3)', fontSize: 13, fontWeight: 500,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t3)')}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
