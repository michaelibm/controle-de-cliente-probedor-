import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wrench, MapPin, User, Zap, CheckCircle,
  Search, ChevronRight, Play, XCircle,
} from 'lucide-react';
import { installationsService } from '../../services/installations.service';

type InstStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

const S_LABEL: Record<InstStatus, string> = {
  PENDING: 'Agendada', CONFIRMED: 'Confirmada', IN_PROGRESS: 'Em andamento',
  DONE: 'Concluída', CANCELLED: 'Cancelada',
};
const S_COLOR: Record<InstStatus, string> = {
  PENDING: 'var(--accent)', CONFIRMED: 'var(--info)', IN_PROGRESS: 'var(--warn)',
  DONE: 'var(--success)', CANCELLED: 'var(--t3)',
};

const STATUS_TABS = [
  { value: '', label: 'Todas' },
  { value: 'PENDING,CONFIRMED', label: 'Agendadas' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'DONE', label: 'Concluídas' },
  { value: 'CANCELLED', label: 'Canceladas' },
];

function AddressBlock({ snap }: { snap: any }) {
  if (!snap) return <span style={{ color: 'var(--t3)', fontSize: 12 }}>Endereço não registrado</span>;
  return (
    <span style={{ fontSize: 12, color: 'var(--t2)' }}>
      {snap.street}, {snap.number}
      {snap.complement ? ` - ${snap.complement}` : ''}
      {', '}{snap.neighborhood}{', '}{snap.city} - {snap.state}
      {snap.reference && <span style={{ color: 'var(--t3)' }}> · Ref: {snap.reference}</span>}
    </span>
  );
}

export function InstalacoesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState('PENDING,CONFIRMED');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['installations', tab, search, dateFilter],
    queryFn: () => installationsService.findAll({
      status: tab || undefined,
      search: search || undefined,
      dateStart: dateFilter || undefined,
      dateEnd: dateFilter || undefined,
      limit: 50,
    }),
    placeholderData: (prev) => prev,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      installationsService.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['installations'] });
      setExpandedId(null);
    },
  });

  const items: any[] = (data as any)?.items ?? [];

  // Group by date
  const grouped = items.reduce((acc: Record<string, any[]>, item: any) => {
    const date = new Date(item.scheduledDate).toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: '2-digit',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <div className="fade-in" style={{ paddingBottom: 20 }}>
      {/* Header */}
      <div style={{
        background: 'var(--s1)', borderBottom: '1px solid var(--bd)',
        position: 'sticky', top: 0, zIndex: 10, padding: '16px 20px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)' }}>Instalações</h1>
          <span style={{ fontSize: 13, color: 'var(--t3)' }}>{(data as any)?.total ?? 0}</span>
        </div>

        {/* Search + date filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente..."
              style={{
                width: '100%', padding: '9px 10px 9px 32px', borderRadius: 10,
                background: 'var(--s2)', border: '1px solid var(--bd)',
                color: 'var(--t1)', fontSize: 13,
              }} />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{
              padding: '9px 10px', borderRadius: 10,
              background: 'var(--s2)', border: '1px solid var(--bd)',
              color: dateFilter ? 'var(--t1)' : 'var(--t3)', fontSize: 12, width: 130,
            }}
          />
        </div>

        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
          {STATUS_TABS.map((t) => (
            <button key={t.value} onClick={() => setTab(t.value)} style={{
              padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              background: tab === t.value ? 'var(--accent)' : 'var(--s2)',
              color: tab === t.value ? '#fff' : 'var(--t2)',
              border: `1px solid ${tab === t.value ? 'var(--accent)' : 'var(--bd)'}`,
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 20px 0' }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{
              height: 90, borderRadius: 14, background: 'var(--s1)',
              border: '1px solid var(--bd)', marginBottom: 8, opacity: 1 - i * 0.2,
            }} />
          ))
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)' }}>
            <Wrench size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: 14 }}>Nenhuma instalação encontrada</div>
          </div>
        ) : (
          Object.entries(grouped).map(([dateLabel, dayItems]) => (
            <div key={dateLabel} style={{ marginBottom: 20 }}>
              {/* Date header */}
              <div style={{
                fontSize: 12, fontWeight: 700, color: 'var(--accent)',
                textTransform: 'capitalize', marginBottom: 8,
                paddingBottom: 6, borderBottom: '1px solid var(--bd)',
                letterSpacing: 0.3,
              }}>
                {dateLabel}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(dayItems as any[]).map((inst: any) => {
                  const status = inst.status as InstStatus;
                  const color = S_COLOR[status];
                  const isExpanded = expandedId === inst.id;
                  const canStart = status === 'PENDING' || status === 'CONFIRMED';
                  const canFinish = status === 'IN_PROGRESS';
                  const canCancel = status !== 'DONE' && status !== 'CANCELLED';

                  return (
                    <div key={inst.id} style={{
                      background: 'var(--s1)', border: '1px solid var(--bd)',
                      borderRadius: 14, overflow: 'hidden',
                      borderLeft: `3px solid ${color}`,
                    }}>
                      {/* Main row */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : inst.id)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12,
                          padding: '13px 16px', background: 'none', border: 'none',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        {/* Time bubble */}
                        <div style={{
                          background: `color-mix(in srgb, ${color} 12%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                          borderRadius: 10, padding: '6px 10px', flexShrink: 0,
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color, fontFamily: 'monospace' }}>
                            {inst.scheduledTime}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--t3)', marginTop: 1 }}>
                            {S_LABEL[status]}
                          </div>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', marginBottom: 3 }}>
                            {inst.customer?.name}
                          </div>

                          {/* Address */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 3 }}>
                            <MapPin size={11} style={{ color: 'var(--t3)', marginTop: 1, flexShrink: 0 }} />
                            <AddressBlock snap={inst.addressSnapshot} />
                          </div>

                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {inst.plan && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Zap size={11} style={{ color: 'var(--accent)' }} />
                                <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
                                  {inst.plan.name} · {inst.plan.downloadSpeed}Mbps
                                </span>
                              </div>
                            )}
                            {inst.technician && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <User size={11} style={{ color: 'var(--t3)' }} />
                                <span style={{ fontSize: 11, color: 'var(--t3)' }}>{inst.technician.name}</span>
                              </div>
                            )}
                            {!inst.technician && (
                              <span style={{ fontSize: 11, color: 'var(--warn)', fontWeight: 500 }}>
                                ⚠ Técnico não atribuído
                              </span>
                            )}
                          </div>
                        </div>

                        <ChevronRight size={16} style={{
                          color: 'var(--t3)', flexShrink: 0, marginTop: 4,
                          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                          transition: 'transform 0.2s',
                        }} />
                      </button>

                      {/* Expanded actions */}
                      {isExpanded && (
                        <div style={{ borderTop: '1px solid var(--bd)', padding: '12px 16px' }}>
                          {/* Contact */}
                          {(inst.customer?.whatsapp || inst.customer?.phone) && (
                            <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 10 }}>
                              📱 {inst.customer.whatsapp || inst.customer.phone}
                            </div>
                          )}
                          {inst.notes && (
                            <div style={{
                              fontSize: 12, color: 'var(--t2)', marginBottom: 12,
                              padding: '8px 12px', borderRadius: 8,
                              background: 'var(--s2)', border: '1px solid var(--bd)',
                            }}>
                              📝 {inst.notes}
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {/* View customer */}
                            <button
                              onClick={() => navigate(`/customers/${inst.customerId}`)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '10px 14px', borderRadius: 10,
                                background: 'var(--s2)', border: '1px solid var(--bd)',
                                color: 'var(--t1)', cursor: 'pointer', fontSize: 13,
                              }}
                            >
                              <User size={14} style={{ color: 'var(--accent)' }} />
                              Ver ficha do cliente
                              <ChevronRight size={14} style={{ color: 'var(--t3)', marginLeft: 'auto' }} />
                            </button>

                            {canStart && (
                              <button
                                onClick={() => statusMutation.mutate({ id: inst.id, status: 'IN_PROGRESS' })}
                                disabled={statusMutation.isPending}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                  padding: '11px', borderRadius: 10,
                                  background: 'var(--warn-dim)', border: '1px solid rgba(245,158,11,0.3)',
                                  color: 'var(--warn)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                                }}
                              >
                                <Play size={14} /> Iniciar instalação
                              </button>
                            )}

                            {canFinish && (
                              <button
                                onClick={() => statusMutation.mutate({ id: inst.id, status: 'DONE' })}
                                disabled={statusMutation.isPending}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                  padding: '11px', borderRadius: 10,
                                  background: 'var(--success-dim)', border: '1px solid rgba(34,197,94,0.3)',
                                  color: 'var(--success)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                                }}
                              >
                                <CheckCircle size={14} /> Concluir instalação
                              </button>
                            )}

                            {canCancel && (
                              <button
                                onClick={() => {
                                  if (confirm('Cancelar esta instalação?')) {
                                    statusMutation.mutate({ id: inst.id, status: 'CANCELLED' });
                                  }
                                }}
                                disabled={statusMutation.isPending}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                  padding: '11px', borderRadius: 10,
                                  background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.25)',
                                  color: 'var(--danger)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                                }}
                              >
                                <XCircle size={14} /> Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
