import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Receipt, Zap, TrendingUp,
  Menu, X, FileText, Settings, LogOut, Bell, UserCog, Wrench, Download, Upload,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';
import { api } from '../../services/api';
import nftLogo from '../../assets/nft-logo.svg';

const tabs = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Início' },
  { to: '/customers', icon: Users, label: 'Clientes' },
  { to: '/receivables', icon: Receipt, label: 'Cobranças' },
  { to: '/financeiro', icon: TrendingUp, label: 'Financeiro' },
];

export function BottomNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout().catch(() => {});
    localStorage.clear();
    setUser(null);
    navigate('/login');
  };

  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImporting(true);
      setImportMsg('');
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const { data } = await api.post('/customers/backup/import', json);
        const { imported } = data;
        setImportMsg(`✓ Importado: ${imported.customers} clientes, ${imported.contracts} contratos, ${imported.receivables} cobranças. (${imported.skipped} ignorados por já existirem)`);
      } catch (err: any) {
        setImportMsg('✗ Erro ao importar. Verifique se o arquivo é válido.');
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  const [backingUp, setBackingUp] = useState(false);
  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const { data } = await api.get('/customers/backup', { responseType: 'blob' });
      const date = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-isp-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBackingUp(false);
      setMenuOpen(false);
    }
  };

  return (
    <>
      {/* Menu slide-up overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Slide-up menu panel */}
      {menuOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 slide-up"
          style={{
            background: 'var(--s2)',
            borderTop: '1px solid var(--bde)',
            borderRadius: '20px 20px 0 0',
            paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 8px' }}>
            <img src={nftLogo} alt="NFT Telecom" style={{ height: 28 }} />
            <button
              onClick={() => setMenuOpen(false)}
              style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid var(--bd)',
                background: 'var(--s3)', color: 'var(--t2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '8px 16px 16px' }}>
            {[
              { icon: FileText, label: 'Contratos', to: '/contracts' },
              { icon: Zap, label: 'Planos', to: '/plans' },
              { icon: Wrench, label: 'Instalações', to: '/instalacoes' },
              { icon: Bell, label: 'Notificações', to: '/notifications' },
              { icon: UserCog, label: 'Usuários', to: '/users' },
              { icon: Settings, label: 'Configurações', to: '/settings' },
            ].map(({ icon: Icon, label, to }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', borderRadius: 12,
                  background: 'var(--s3)', border: '1px solid var(--bd)',
                  color: 'var(--t1)', textDecoration: 'none', fontSize: 14, fontWeight: 500,
                }}
              >
                <Icon size={18} style={{ color: 'var(--t2)' }} />
                {label}
              </NavLink>
            ))}
          </div>

          <div style={{ padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {importMsg && (
              <div style={{
                fontSize: 12, padding: '10px 12px', borderRadius: 10,
                background: importMsg.startsWith('✓') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: importMsg.startsWith('✓') ? '#10b981' : '#ef4444',
                border: `1px solid ${importMsg.startsWith('✓') ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
              }}>
                {importMsg}
              </div>
            )}
            <button
              onClick={handleImport}
              disabled={importing}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 16px', borderRadius: 12,
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                color: '#10b981', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                opacity: importing ? 0.7 : 1,
              }}
            >
              <Upload size={18} />
              {importing ? 'Importando...' : 'Importar backup'}
            </button>
            <button
              onClick={handleBackup}
              disabled={backingUp}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 16px', borderRadius: 12,
                background: 'rgba(34,229,92,0.08)', border: '1px solid rgba(34,229,92,0.20)',
                color: 'var(--accent)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                opacity: backingUp ? 0.7 : 1,
              }}
            >
              <Download size={18} />
              {backingUp ? 'Gerando backup...' : 'Gerar backup dos dados'}
            </button>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 16px', borderRadius: 12,
                background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.20)',
                color: 'var(--danger)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
              }}
            >
              <LogOut size={18} />
              Sair da conta
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: 'var(--nav-h)',
          background: 'var(--s1)',
          borderTop: '1px solid var(--bd)',
          display: 'flex', alignItems: 'center',
          paddingBottom: 'env(safe-area-inset-bottom)',
          zIndex: 30,
        }}
      >
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 3, paddingTop: 6, paddingBottom: 4,
              color: isActive ? 'var(--accent)' : 'var(--t3)',
              textDecoration: 'none', transition: 'color 0.15s',
              position: 'relative',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span style={{
                    position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                    width: 28, height: 2, borderRadius: 2, background: 'var(--accent)',
                  }} />
                )}
                <Icon size={22} />
                <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0.2 }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Menu button */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 3, paddingTop: 6, paddingBottom: 4,
            color: menuOpen ? 'var(--accent)' : 'var(--t3)',
            background: 'none', border: 'none', cursor: 'pointer',
            position: 'relative',
          }}
        >
          {menuOpen && (
            <span style={{
              position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
              width: 28, height: 2, borderRadius: 2, background: 'var(--accent)',
            }} />
          )}
          <Menu size={22} />
          <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0.2 }}>Menu</span>
        </button>
      </nav>
    </>
  );
}
