import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Shield, DollarSign, Headphones, Wrench, UserIcon, X, Eye, EyeOff, ToggleLeft, ToggleRight, Pencil } from 'lucide-react';
import { usersService, type AppUser, type UserRole } from '../../services/users.service';

const ROLES: { value: UserRole; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'ADMIN',      label: 'Administrador', color: '#ef4444', icon: <Shield size={13} /> },
  { value: 'FINANCIAL',  label: 'Financeiro',    color: '#8b5cf6', icon: <DollarSign size={13} /> },
  { value: 'ATTENDANT',  label: 'Atendente',     color: '#3b82f6', icon: <UserIcon size={13} /> },
  { value: 'SUPPORT',    label: 'Suporte',       color: '#f59e0b', icon: <Headphones size={13} /> },
  { value: 'INSTALLER',  label: 'Instalador',    color: '#10b981', icon: <Wrench size={13} /> },
];

function roleInfo(role: UserRole) {
  return ROLES.find(r => r.value === role) ?? ROLES[2];
}

function RoleBadge({ role }: { role: UserRole }) {
  const r = roleInfo(role);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
      background: r.color + '1a', color: r.color,
    }}>
      {r.icon}{r.label}
    </span>
  );
}

type FormData = { name: string; email: string; password: string; role: UserRole };
const EMPTY: FormData = { name: '', email: '', password: '', role: 'ATTENDANT' };

function UserModal({
  user,
  onClose,
}: {
  user?: AppUser;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormData>(
    user ? { name: user.name, email: user.email, password: '', role: user.role } : EMPTY
  );
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      user
        ? usersService.update(user.id, data.password ? data : { name: data.name, email: data.email, role: data.role })
        : usersService.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); onClose(); },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Erro ao salvar'),
  });

  const isEdit = !!user;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480, margin: '0 auto',
        background: 'var(--base)', borderRadius: '20px 20px 0 0',
        padding: '24px 20px 36px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--t1)' }}>
            {isEdit ? 'Editar usuário' : 'Novo usuário'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="Nome completo"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            style={inputStyle}
          />
          <input
            placeholder="E-mail"
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            style={inputStyle}
          />
          <div style={{ position: 'relative' }}>
            <input
              placeholder={isEdit ? 'Nova senha (deixe em branco para não alterar)' : 'Senha'}
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              style={{ ...inputStyle, paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)',
              }}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 8 }}>Perfil de acesso</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: r.value }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    border: `1.5px solid ${form.role === r.value ? r.color : 'var(--bd)'}`,
                    background: form.role === r.value ? r.color + '15' : 'var(--s1)',
                    color: form.role === r.value ? r.color : 'var(--t2)',
                    fontSize: 13, fontWeight: form.role === r.value ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 13, color: 'var(--danger)', background: 'var(--danger)15', padding: '8px 12px', borderRadius: 8 }}>
              {error}
            </div>
          )}

          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.name || !form.email || (!isEdit && !form.password)}
            style={{
              marginTop: 4, padding: '14px', borderRadius: 12,
              background: 'var(--accent)', color: '#fff', border: 'none',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              opacity: mutation.isPending ? 0.7 : 1,
            }}
          >
            {mutation.isPending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar usuário'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  border: '1px solid var(--bd)', background: 'var(--s1)',
  color: 'var(--t1)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

export function UsersPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.findAll(1, 50),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => usersService.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const users: AppUser[] = data?.items ?? [];

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)' }}>Usuários</div>
          <div style={{ fontSize: 13, color: 'var(--t3)' }}>{users.length} cadastrado{users.length !== 1 ? 's' : ''}</div>
        </div>
        <button
          onClick={() => { setEditUser(undefined); setShowModal(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 16px', borderRadius: 12,
            background: 'var(--accent)', color: '#fff', border: 'none',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <UserPlus size={16} /> Novo
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--t3)' }}>Carregando...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {users.map(u => (
            <div key={u.id} style={{
              background: 'var(--s1)', borderRadius: 14,
              border: '1px solid var(--bd)', padding: '14px 16px',
              opacity: u.isActive ? 1 : 0.5,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--t1)', marginBottom: 4 }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 8 }}>{u.email}</div>
                  <RoleBadge role={u.role} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => { setEditUser(u); setShowModal(true); }}
                    style={{
                      background: 'var(--s2)', border: '1px solid var(--bd)',
                      borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: 'var(--t2)',
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => toggleMutation.mutate(u.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: u.isActive ? 'var(--success)' : 'var(--t3)',
                    }}
                  >
                    {u.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                </div>
              </div>
              {u.lastLoginAt && (
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>
                  Último acesso: {new Date(u.lastLoginAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <UserModal user={editUser} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
