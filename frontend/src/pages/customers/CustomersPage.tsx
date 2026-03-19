import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, X, ChevronRight, Wifi, WifiOff } from 'lucide-react';
import { customersService } from '../../services/customers.service';
import type { Customer, CustomerStatus } from '../../types/api.types';

const STATUS_LABEL: Record<CustomerStatus, string> = {
  ACTIVE: 'Ativo', BLOCKED: 'Bloqueado', SUSPENDED: 'Suspenso',
  CANCELLED: 'Cancelado', ACTIVATING: 'Ativando',
};
const STATUS_COLOR: Record<CustomerStatus, string> = {
  ACTIVE: 'var(--success)', BLOCKED: 'var(--danger)', SUSPENDED: 'var(--warn)',
  CANCELLED: 'var(--t3)', ACTIVATING: 'var(--info)',
};

const FILTERS: { label: string; value: CustomerStatus | '' }[] = [
  { label: 'Todos', value: '' },
  { label: 'Ativos', value: 'ACTIVE' },
  { label: 'Bloqueados', value: 'BLOCKED' },
  { label: 'Suspensos', value: 'SUSPENDED' },
];

function CustomerCard({ customer, onClick }: { customer: Customer; onClick: () => void }) {
  const color = STATUS_COLOR[customer.status];
  const isActive = customer.status === 'ACTIVE';
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px', background: 'var(--s1)', border: '1px solid var(--bd)',
      borderRadius: 14, cursor: 'pointer', textAlign: 'left',
      transition: 'border-color 0.15s',
    }}>
      {/* Avatar */}
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {isActive
          ? <Wifi size={18} style={{ color }} />
          : <WifiOff size={18} style={{ color }} />
        }
        {/* Pulse dot para ativos */}
        {isActive && (
          <span className="pulse-active" style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 8, height: 8, borderRadius: '50%', background: color,
            border: '2px solid var(--s1)',
          }} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {customer.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>
          #{customer.code} · {customer.phone}
        </div>
      </div>

      {/* Status badge + arrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
          background: `color-mix(in srgb, ${color} 12%, transparent)`,
          color,
        }}>
          {STATUS_LABEL[customer.status]}
        </span>
        <ChevronRight size={14} style={{ color: 'var(--t3)' }} />
      </div>
    </button>
  );
}

export function CustomersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, statusFilter, page],
    queryFn: () => customersService.findAll({
      search: search || undefined,
      status: statusFilter || undefined,
      page,
      limit: 20,
    }),
    placeholderData: (prev) => prev,
  });

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };

  return (
    <div className="fade-in" style={{ paddingBottom: 16 }}>
      {/* Top bar */}
      <div style={{
        background: 'var(--s1)', borderBottom: '1px solid var(--bd)',
        position: 'sticky', top: 0, zIndex: 10, padding: '16px 20px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)' }}>Clientes</h1>
          <span style={{ fontSize: 13, color: 'var(--t3)' }}>
            {data?.total ?? 0} cadastros
          </span>
        </div>

        {/* Busca */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={15} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)',
          }} />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Nome, CPF, telefone..."
            style={{
              width: '100%', padding: '10px 36px 10px 36px',
              borderRadius: 10, background: 'var(--s2)', border: '1px solid var(--bd)',
              color: 'var(--t1)', fontSize: 14,
            }}
          />
          {search && (
            <button onClick={() => handleSearch('')} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtros chip */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
          {FILTERS.map((f) => {
            const active = statusFilter === f.value;
            return (
              <button key={f.value} onClick={() => { setStatusFilter(f.value); setPage(1); }} style={{
                padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap', fontSize: 13, fontWeight: 500,
                background: active ? 'var(--accent)' : 'var(--s2)',
                color: active ? '#fff' : 'var(--t2)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--bd)'}`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista */}
      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{
              height: 70, borderRadius: 14, background: 'var(--s1)',
              border: '1px solid var(--bd)', opacity: 1 - i * 0.12,
            }} className="animate-pulse" />
          ))
        ) : data?.items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)' }}>
            <WifiOff size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: 14 }}>Nenhum cliente encontrado</div>
          </div>
        ) : (
          data?.items.map((c) => (
            <CustomerCard key={c.id} customer={c} onClick={() => navigate(`/customers/${c.id}`)} />
          ))
        )}
      </div>

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '8px 20px' }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            style={{
              padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500,
              background: 'var(--s2)', border: '1px solid var(--bd)',
              color: page === 1 ? 'var(--t3)' : 'var(--t1)', cursor: page === 1 ? 'default' : 'pointer',
            }}>
            Anterior
          </button>
          <span style={{ fontSize: 13, color: 'var(--t3)' }}>{page} / {data.totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}
            style={{
              padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500,
              background: 'var(--s2)', border: '1px solid var(--bd)',
              color: page === data.totalPages ? 'var(--t3)' : 'var(--t1)',
              cursor: page === data.totalPages ? 'default' : 'pointer',
            }}>
            Próxima
          </button>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => navigate('/customers/new')}
        style={{
          position: 'fixed', bottom: 'calc(var(--nav-h) + 16px)', right: 20,
          width: 52, height: 52, borderRadius: 16,
          background: 'var(--accent)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px var(--accent-glow)',
          zIndex: 20,
        }}
      >
        <Plus size={22} style={{ color: '#fff' }} />
      </button>
    </div>
  );
}
