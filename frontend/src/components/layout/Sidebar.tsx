import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Package, DollarSign,
  CreditCard, Bell, BarChart3, Settings, LogOut, ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../utils/formatters';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';
import nftLogo from '../../assets/nft-logo.svg';

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
        background: 'linear-gradient(180deg, var(--s2) 0%, var(--s1) 100%)',
        borderRight: '1px solid var(--bd)',
        width: collapsed ? 64 : 240,
        transition: 'width 0.3s ease',
        position: 'relative', flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10, padding: collapsed ? '20px 0' : '18px 20px',
        borderBottom: '1px solid var(--bd)', minHeight: 68,
      }}>
        {collapsed ? (
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'rgba(34,229,92,0.1)',
            border: '1px solid rgba(34,229,92,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 13, fontWeight: 900, fontStyle: 'italic', color: 'var(--accent)' }}>N</span>
          </div>
        ) : (
          <img src={nftLogo} alt="NFT Telecom" style={{ height: 36, display: 'block' }} />
        )}
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute', right: -12, top: 22,
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--s2)', border: '1px solid var(--bd)',
          color: 'var(--t3)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', zIndex: 10,
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
              background: isActive
                ? 'linear-gradient(90deg, rgba(34,229,92,0.15) 0%, rgba(34,229,92,0.05) 100%)'
                : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--t2)',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              boxShadow: isActive ? 'inset 0 0 12px rgba(34,229,92,0.06)' : 'none',
            })}
          >
            <Icon size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ borderTop: '1px solid var(--bd)', padding: '10px 8px' }}>
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
