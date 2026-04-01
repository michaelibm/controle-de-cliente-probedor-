import { Bell, Search, User, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador', MANAGER: 'Gerente', FINANCIAL: 'Financeiro',
  ATTENDANT: 'Atendimento', SUPPORT: 'Suporte', READONLY: 'Visualização',
};

export function Header() {
  const { user } = useAuthStore();

  return (
    <header style={{
      height: 56, background: 'var(--s1)', borderBottom: '1px solid var(--bd)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', flexShrink: 0,
    }}>
      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--s2)', border: '1px solid var(--bd)',
        borderRadius: 10, padding: '8px 12px', width: 280,
      }}>
        <Search size={15} style={{ color: 'var(--t3)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Buscar clientes, cobranças..."
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            fontSize: 13, color: 'var(--t1)', width: '100%',
          }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button style={{
          position: 'relative', padding: 8, borderRadius: 10,
          background: 'var(--s2)', border: '1px solid var(--bd)',
          color: 'var(--t2)', cursor: 'pointer', display: 'flex',
        }}>
          <Bell size={17} />
          <span style={{
            position: 'absolute', top: 6, right: 6,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--danger)',
          }} />
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          paddingLeft: 12, borderLeft: '1px solid var(--bd)',
          cursor: 'pointer',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(34,229,92,0.12)',
            border: '1px solid rgba(34,229,92,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <User size={15} style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ fontSize: 13 }}>
            <p style={{ fontWeight: 500, color: 'var(--t1)', lineHeight: 1.3 }}>{user?.name}</p>
            <p style={{ fontSize: 11, color: 'var(--t3)' }}>{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</p>
          </div>
          <ChevronDown size={13} style={{ color: 'var(--t3)' }} />
        </div>
      </div>
    </header>
  );
}
