import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, FileText, Search, X, ChevronRight, Zap } from 'lucide-react';
import { contractsService } from '../../services/contracts.service';
import type { Contract, ContractStatus } from '../../types/api.types';

function fmt(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const STATUS_LABEL: Record<ContractStatus, string> = {
  ACTIVE: 'Ativo', SUSPENDED: 'Suspenso', CANCELLED: 'Cancelado', PENDING_ACTIVATION: 'Aguardando',
};
const STATUS_COLOR: Record<ContractStatus, string> = {
  ACTIVE: 'var(--success)', SUSPENDED: 'var(--warn)',
  CANCELLED: 'var(--danger)', PENDING_ACTIVATION: 'var(--info)',
};

const TABS: { label: string; value: ContractStatus | '' }[] = [
  { label: 'Todos', value: '' },
  { label: 'Ativos', value: 'ACTIVE' },
  { label: 'Suspensos', value: 'SUSPENDED' },
  { label: 'Cancelados', value: 'CANCELLED' },
];

function ContractCard({ contract, onClick }: { contract: Contract; onClick: () => void }) {
  const color = STATUS_COLOR[contract.status];
  return (
    <button onClick={onClick} style={{
      width: '100%', background: 'var(--s1)', border: '1px solid var(--bd)',
      borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
      borderLeft: `3px solid ${color}`, textAlign: 'left',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contract.customer?.name ?? '—'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
            {contract.number}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 10 }}>
          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>
            {fmt(contract.monthlyValue)}
          </div>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
            background: `color-mix(in srgb, ${color} 12%, transparent)`, color,
          }}>
            {STATUS_LABEL[contract.status]}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={12} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 12, color: 'var(--t2)' }}>
            {contract.plan?.name ?? '—'} · dia {contract.dueDay}
          </span>
        </div>
        <ChevronRight size={14} style={{ color: 'var(--t3)' }} />
      </div>
    </button>
  );
}

export function ContractsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<ContractStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['contracts', tab, search, page],
    queryFn: () => contractsService.findAll({
      status: tab || undefined,
      page, limit: 20,
    }),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="fade-in" style={{ paddingBottom: 16 }}>
      {/* Header */}
      <div style={{
        background: 'var(--s1)', borderBottom: '1px solid var(--bd)',
        position: 'sticky', top: 0, zIndex: 10, padding: '16px 20px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)' }}>Contratos</h1>
          <span style={{ fontSize: 13, color: 'var(--t3)' }}>{data?.total ?? 0} registros</span>
        </div>

        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
          {TABS.map((t) => (
            <button key={t.value} onClick={() => { setTab(t.value); setPage(1); }} style={{
              padding: '7px 16px', borderRadius: 20, whiteSpace: 'nowrap',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
              background: tab === t.value ? 'var(--accent)' : 'var(--s2)',
              color: tab === t.value ? '#fff' : 'var(--t2)',
              border: `1px solid ${tab === t.value ? 'var(--accent)' : 'var(--bd)'}`,
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{
              height: 82, borderRadius: 14, background: 'var(--s1)',
              border: '1px solid var(--bd)', opacity: 1 - i * 0.15,
            }} />
          ))
        ) : data?.items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)' }}>
            <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: 14 }}>Nenhum contrato encontrado</div>
          </div>
        ) : (
          data?.items.map((c) => (
            <ContractCard key={c.id} contract={c} onClick={() => navigate(`/contracts/${c.id}`)} />
          ))
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '8px 20px' }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, background: 'var(--s2)',
              border: '1px solid var(--bd)', color: page === 1 ? 'var(--t3)' : 'var(--t1)',
              cursor: page === 1 ? 'default' : 'pointer' }}>
            Anterior
          </button>
          <span style={{ fontSize: 13, color: 'var(--t3)' }}>{page} / {data.totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}
            style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, background: 'var(--s2)',
              border: '1px solid var(--bd)', color: page === data.totalPages ? 'var(--t3)' : 'var(--t1)',
              cursor: page === data.totalPages ? 'default' : 'pointer' }}>
            Próxima
          </button>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => navigate('/contracts/new')} style={{
        position: 'fixed', bottom: 'calc(var(--nav-h) + 16px)', right: 20,
        width: 52, height: 52, borderRadius: 16,
        background: 'var(--accent)', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px var(--accent-glow)', zIndex: 20,
      }}>
        <Plus size={22} style={{ color: '#fff' }} />
      </button>
    </div>
  );
}
