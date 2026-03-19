import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, X, ChevronRight, CheckCircle, Clock, DollarSign, ChevronDown, User,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { receivablesService } from '../../services/receivables.service';
import type { Receivable, ReceivableStatus, PaymentMethod } from '../../types/api.types';

function fmt(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const STATUS_LABEL: Record<ReceivableStatus, string> = {
  PENDING: 'Pendente', PAID: 'Pago', OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado', RENEGOTIATED: 'Renegociado', PARTIAL: 'Parcial', EXEMPT: 'Isento',
};
const STATUS_COLOR: Record<ReceivableStatus, string> = {
  PENDING: 'var(--warn)', PAID: 'var(--success)', OVERDUE: 'var(--danger)',
  CANCELLED: 'var(--t3)', RENEGOTIATED: 'var(--info)', PARTIAL: 'var(--accent)', EXEMPT: 'var(--t3)',
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'PIX', label: 'PIX' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'CREDIT_CARD', label: 'Cartão Crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão Débito' },
  { value: 'TRANSFER', label: 'Transferência' },
];

const TABS: { label: string; status: string }[] = [
  { label: 'Todas', status: '' },
  { label: 'Pendentes', status: 'PENDING' },
  { label: 'Vencidas', status: 'OVERDUE' },
  { label: 'Pagas', status: 'PAID' },
];

/* ---- Pay Modal ---- */
type PayForm = { amount: string; paymentMethod: PaymentMethod; paidAt: string; notes?: string };

function PayModal({ receivable, onClose, onSuccess }: {
  receivable: Receivable; onClose: () => void; onSuccess: () => void;
}) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PayForm>({
    defaultValues: {
      amount: String(receivable.remainingAmount),
      paymentMethod: 'PIX',
      paidAt: new Date().toISOString().slice(0, 10),
    },
  });

  const mutation = useMutation({
    mutationFn: (data: PayForm) => receivablesService.pay(receivable.id, {
      amount: Number(data.amount),
      paymentMethod: data.paymentMethod,
      paidAt: data.paidAt,
      notes: data.notes,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receivables'] });
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
      onSuccess();
    },
  });

  const onSubmit = (data: PayForm) => mutation.mutateAsync(data).catch(() => {});

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)', zIndex: 50,
      }} />
      <div className="slide-up" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
        background: 'var(--s2)', border: '1px solid var(--bde)',
        borderRadius: '20px 20px 0 0',
        padding: '20px 20px calc(max(env(safe-area-inset-bottom), 16px) + 16px)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>Registrar Recebimento</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{receivable.customer?.name}</div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--s3)',
            border: '1px solid var(--bd)', color: 'var(--t2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Info cobrança */}
        <div style={{
          background: 'var(--s3)', border: '1px solid var(--bd)', borderRadius: 12,
          padding: '12px 16px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--t3)' }}>{receivable.description}</span>
            <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>
              {fmt(Number(receivable.remainingAmount))}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>
            Vencimento: {new Date(receivable.dueDate).toLocaleDateString('pt-BR')}
          </div>
        </div>

        {mutation.isError && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10,
            background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.25)',
            fontSize: 13, color: 'var(--danger)' }}>
            Erro ao registrar pagamento. Tente novamente.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>
              Valor recebido (R$)
            </label>
            <input {...register('amount', { required: true, min: 0.01 })} type="number" step="0.01"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10,
                background: 'var(--s1)', border: `1px solid ${errors.amount ? 'var(--danger)' : 'var(--bd)'}`,
                color: 'var(--t1)', fontSize: 16, fontWeight: 600 }} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--t2)', display: 'block', marginBottom: 8 }}>
              Forma de pagamento
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {PAYMENT_METHODS.map((m) => (
                <label key={m.value} style={{ cursor: 'pointer' }}>
                  <input {...register('paymentMethod')} type="radio" value={m.value} style={{ display: 'none' }} />
                  <div style={{
                    padding: '10px 8px', borderRadius: 10, textAlign: 'center',
                    fontSize: 12, fontWeight: 500, background: 'var(--s1)',
                    border: '1px solid var(--bd)', color: 'var(--t2)',
                    cursor: 'pointer',
                  }}>
                    {m.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>
              Data do pagamento
            </label>
            <input {...register('paidAt', { required: true })} type="date"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10,
                background: 'var(--s1)', border: '1px solid var(--bd)',
                color: 'var(--t1)', fontSize: 14 }} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--t2)', display: 'block', marginBottom: 6 }}>
              Observação (opcional)
            </label>
            <input {...register('notes')} type="text" placeholder="Ex: pago pelo app"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10,
                background: 'var(--s1)', border: '1px solid var(--bd)',
                color: 'var(--t1)', fontSize: 14 }} />
          </div>

          <button type="submit" disabled={isSubmitting} style={{
            marginTop: 4, padding: '14px', borderRadius: 12,
            background: isSubmitting ? 'var(--s3)' : 'var(--success)',
            border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: isSubmitting ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {isSubmitting ? 'Registrando...' : <><CheckCircle size={18} /> Confirmar Recebimento</>}
          </button>
        </form>
      </div>
    </>
  );
}

/* ---- Page ---- */
export function ReceivablesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('status') || '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [paying, setPaying] = useState<Receivable | null>(null);
  // Set of customer IDs that are collapsed
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['receivables', tab, search, page],
    queryFn: () => receivablesService.findAll({
      status: tab || undefined,
      search: search || undefined,
      page, limit: 50,
    }),
    placeholderData: (prev) => prev,
  });

  // Group receivables by customer
  const groups = useMemo(() => {
    if (!data?.items) return [];
    const map = new Map<string, { customerId: string; customerName: string; items: Receivable[] }>();
    for (const r of data.items) {
      const cid = r.customer?.id ?? 'unknown';
      const cname = r.customer?.name ?? 'Cliente';
      if (!map.has(cid)) map.set(cid, { customerId: cid, customerName: cname, items: [] });
      map.get(cid)!.items.push(r);
    }
    return Array.from(map.values());
  }, [data?.items]);

  const toggleCollapse = (customerId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(customerId)) next.delete(customerId);
      else next.add(customerId);
      return next;
    });
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 16 }}>
      {/* Top bar */}
      <div style={{
        background: 'var(--s1)', borderBottom: '1px solid var(--bd)',
        position: 'sticky', top: 0, zIndex: 10, padding: '16px 20px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)' }}>Cobranças</h1>
          <span style={{ fontSize: 13, color: 'var(--t3)' }}>{data?.total ?? 0} registros</span>
        </div>

        {/* Busca */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar cliente ou código..."
            style={{ width: '100%', padding: '10px 36px', borderRadius: 10,
              background: 'var(--s2)', border: '1px solid var(--bd)', color: 'var(--t1)', fontSize: 14 }} />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
          {TABS.map((t) => (
            <button key={t.status} onClick={() => { setTab(t.status); setPage(1); }} style={{
              padding: '7px 16px', borderRadius: 20, whiteSpace: 'nowrap',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
              background: tab === t.status ? 'var(--accent)' : 'var(--s2)',
              color: tab === t.status ? '#fff' : 'var(--t2)',
              border: `1px solid ${tab === t.status ? 'var(--accent)' : 'var(--bd)'}`,
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista agrupada por cliente */}
      <div style={{ padding: '12px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{
              height: 64, borderRadius: 14, background: 'var(--s1)',
              border: '1px solid var(--bd)', opacity: 1 - i * 0.15,
            }} />
          ))
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)' }}>
            <DollarSign size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: 14 }}>Nenhuma cobrança encontrada</div>
          </div>
        ) : (
          groups.map((group) => {
            const isCollapsed = collapsed.has(group.customerId);
            const total = group.items.reduce((sum, r) => sum + Number(r.remainingAmount || r.finalAmount), 0);
            const overdueCount = group.items.filter((r) => r.status === 'OVERDUE').length;
            const paidCount = group.items.filter((r) => r.status === 'PAID').length;
            const pendingCount = group.items.filter((r) => r.status === 'PENDING').length;

            return (
              <div key={group.customerId} style={{
                background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16, overflow: 'hidden',
              }}>
                {/* Customer header — tap to collapse/expand */}
                <button
                  onClick={() => toggleCollapse(group.customerId)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 16px',
                    background: isCollapsed ? 'var(--s2)' : 'var(--s2)',
                    border: 'none', borderBottom: isCollapsed ? 'none' : '1px solid var(--bd)',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: overdueCount > 0 ? 'var(--danger-dim)' : 'var(--accent-dim)',
                    border: `1px solid ${overdueCount > 0 ? 'rgba(239,68,68,0.25)' : 'var(--accent)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <User size={15} style={{ color: overdueCount > 0 ? 'var(--danger)' : 'var(--accent)' }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {group.customerName}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                        {group.items.length} cobrança{group.items.length !== 1 ? 's' : ''}
                      </span>
                      {overdueCount > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600 }}>
                          · {overdueCount} vencida{overdueCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {pendingCount > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--warn)', fontWeight: 600 }}>
                          · {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {paidCount > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>
                          · {paidCount} pago{paidCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="mono" style={{
                      fontSize: 14, fontWeight: 700,
                      color: overdueCount > 0 ? 'var(--danger)' : 'var(--t1)',
                    }}>
                      {total > 0 ? total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                    </div>
                    <ChevronDown size={14} style={{
                      color: 'var(--t3)', marginTop: 4,
                      transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)',
                      transition: 'transform 0.2s',
                      display: 'block', marginLeft: 'auto',
                    }} />
                  </div>
                </button>

                {/* Receivables list */}
                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {group.items.map((r, idx) => (
                      <div key={r.id} style={{
                        borderBottom: idx < group.items.length - 1 ? '1px solid var(--bd)' : 'none',
                        borderLeft: `3px solid ${STATUS_COLOR[r.status]}`,
                      }}>
                        <div style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
                                {r.description}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                                Vence: {new Date(r.dueDate).toLocaleDateString('pt-BR')}
                                {r.paidDate && ` · Pago: ${new Date(r.paidDate).toLocaleDateString('pt-BR')}`}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                              <div className="mono" style={{
                                fontSize: 15, fontWeight: 700,
                                color: r.status === 'OVERDUE' ? 'var(--danger)' : 'var(--t1)',
                              }}>
                                {Number(r.remainingAmount || r.finalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </div>
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                                background: `color-mix(in srgb, ${STATUS_COLOR[r.status]} 12%, transparent)`,
                                color: STATUS_COLOR[r.status],
                              }}>
                                {STATUS_LABEL[r.status]}
                              </span>
                            </div>
                          </div>

                          {['PENDING', 'OVERDUE', 'PARTIAL'].includes(r.status) && (
                            <button onClick={() => setPaying(r)} style={{
                              marginTop: 10, width: '100%', padding: '9px', borderRadius: 9,
                              background: 'var(--success-dim)', border: '1px solid rgba(34,197,94,0.25)',
                              color: 'var(--success)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}>
                              <CheckCircle size={14} /> Receber pagamento
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Paginação */}
      {data && data.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px 20px 0' }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500,
              background: 'var(--s2)', border: '1px solid var(--bd)',
              color: page === 1 ? 'var(--t3)' : 'var(--t1)', cursor: page === 1 ? 'default' : 'pointer' }}>
            Anterior
          </button>
          <span style={{ fontSize: 13, color: 'var(--t3)' }}>{page} / {data.totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}
            style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500,
              background: 'var(--s2)', border: '1px solid var(--bd)',
              color: page === data.totalPages ? 'var(--t3)' : 'var(--t1)',
              cursor: page === data.totalPages ? 'default' : 'pointer' }}>
            Próxima
          </button>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => navigate('/receivables/new')} style={{
        position: 'fixed', bottom: 'calc(var(--nav-h) + 16px)', right: 20,
        width: 52, height: 52, borderRadius: 16,
        background: 'var(--success)', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px var(--success-dim)', zIndex: 20,
      }}>
        <Plus size={22} style={{ color: '#fff' }} />
      </button>

      {/* Pay modal */}
      {paying && (
        <PayModal
          receivable={paying}
          onClose={() => setPaying(null)}
          onSuccess={() => setPaying(null)}
        />
      )}
    </div>
  );
}
