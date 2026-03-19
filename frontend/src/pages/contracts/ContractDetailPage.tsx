import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Zap, User, Calendar, DollarSign, Receipt,
  ChevronRight, Plus, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, XCircle, ChevronDown,
} from 'lucide-react';
import { contractsService } from '../../services/contracts.service';
import { receivablesService } from '../../services/receivables.service';
import type { ContractStatus, Receivable } from '../../types/api.types';

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

type RStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL' | 'CANCELLED' | 'RENEGOTIATED' | 'EXEMPT';
const R_LABEL: Record<RStatus, string> = {
  PENDING: 'Pendente', PAID: 'Pago', OVERDUE: 'Vencida',
  PARTIAL: 'Parcial', CANCELLED: 'Cancelada', RENEGOTIATED: 'Renegociada', EXEMPT: 'Isento',
};
const R_COLOR: Record<RStatus, string> = {
  PENDING: 'var(--warn)', PAID: 'var(--success)', OVERDUE: 'var(--danger)',
  PARTIAL: 'var(--info)', CANCELLED: 'var(--t3)', RENEGOTIATED: 'var(--t3)', EXEMPT: 'var(--t3)',
};

function RStatusIcon({ status }: { status: RStatus }) {
  const color = R_COLOR[status] || 'var(--t3)';
  if (status === 'PAID') return <CheckCircle2 size={16} style={{ color }} />;
  if (status === 'OVERDUE') return <XCircle size={16} style={{ color }} />;
  if (status === 'CANCELLED' || status === 'RENEGOTIATED') return <XCircle size={16} style={{ color }} />;
  return <Clock size={16} style={{ color }} />;
}

type InfoRowProps = { icon: React.ReactNode; label: string; value?: string | number };
function InfoRow({ icon, label, value }: InfoRowProps) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '10px 0', borderBottom: '1px solid var(--bd)',
    }}>
      <span style={{ color: 'var(--t3)', marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 14, color: 'var(--t1)', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showActions, setShowActions] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => contractsService.getById(id!),
    enabled: !!id,
  });

  // Load payment history (all receivables for this contract)
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['receivables', 'contract', id],
    queryFn: () => receivablesService.findAll({ contractId: id!, limit: 50, order: 'asc' }),
    enabled: !!id,
  });

  const suspendMutation = useMutation({
    mutationFn: () => contractsService.suspend(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract', id] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
      setShowActions(false);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => contractsService.cancel(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract', id] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
      setShowActions(false);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => contractsService.reactivate(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract', id] });
      qc.invalidateQueries({ queryKey: ['contracts'] });
      setShowActions(false);
    },
  });

  const generateMutation = useMutation({
    mutationFn: () => receivablesService.generateAnnual(id!),
    onSuccess: (result: any) => {
      qc.invalidateQueries({ queryKey: ['receivables', 'contract', id] });
      qc.invalidateQueries({ queryKey: ['contract', id] });
      setShowActions(false);
      const msg = result.created > 0
        ? `${result.created} mensalidade(s) gerada(s)! ${result.skipped > 0 ? `(${result.skipped} já existiam)` : ''}`
        : `Todas as mensalidades já foram geradas (${result.skipped} existentes).`;
      alert(msg);
    },
    onError: () => alert('Erro ao gerar mensalidades. Tente novamente.'),
  });

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div className="animate-spin" style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '2px solid var(--bd)', borderTopColor: 'var(--accent)',
      }} />
    </div>
  );

  if (!contract) return null;

  const c = contract as any;
  const statusColor = STATUS_COLOR[c.status as ContractStatus];
  const isActive = c.status === 'ACTIVE';
  const receivables: Receivable[] = (historyData as any)?.items ?? [];

  // Summary counts
  const paidCount = receivables.filter((r: any) => r.status === 'PAID').length;
  const pendingCount = receivables.filter((r: any) => ['PENDING', 'OVERDUE', 'PARTIAL'].includes(r.status)).length;
  const overdueCount = receivables.filter((r: any) => r.status === 'OVERDUE').length;

  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', background: 'var(--s1)', borderBottom: '1px solid var(--bd)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={() => navigate(-1)} style={{
          width: 36, height: 36, borderRadius: 10, border: '1px solid var(--bd)',
          background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>Contrato</div>
        <button onClick={() => setShowActions((v) => !v)} style={{
          padding: '8px 14px', borderRadius: 10, border: '1px solid var(--bd)',
          background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer', fontSize: 13,
        }}>
          Ações
        </button>
      </div>

      {/* Actions menu */}
      {showActions && (
        <>
          <div onClick={() => setShowActions(false)} style={{
            position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.5)',
          }} />
          <div className="slide-up" style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
            background: 'var(--s2)', border: '1px solid var(--bde)',
            borderRadius: '20px 20px 0 0',
            padding: '20px 20px calc(max(env(safe-area-inset-bottom), 16px) + 16px)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 16 }}>
              Ações do Contrato
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isActive && (
                <button onClick={() => suspendMutation.mutate()} disabled={suspendMutation.isPending}
                  style={{
                    padding: '13px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    background: 'var(--warn-dim)', border: '1px solid rgba(245,158,11,0.25)',
                    color: 'var(--warn)', display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                  <AlertTriangle size={16} />
                  {suspendMutation.isPending ? 'Suspendendo...' : 'Suspender contrato'}
                </button>
              )}
              {(c.status === 'SUSPENDED' || c.status === 'PENDING_ACTIVATION') && (
                <button onClick={() => reactivateMutation.mutate()} disabled={reactivateMutation.isPending}
                  style={{
                    padding: '13px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    background: 'var(--success-dim)', border: '1px solid rgba(34,197,94,0.25)',
                    color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                  <RefreshCw size={16} />
                  {reactivateMutation.isPending ? 'Reativando...' : 'Reativar contrato'}
                </button>
              )}
              {c.status !== 'CANCELLED' && (
                <button onClick={() => {
                  if (confirm('Tem certeza que deseja cancelar este contrato?')) cancelMutation.mutate();
                }} disabled={cancelMutation.isPending}
                  style={{
                    padding: '13px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.25)',
                    color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                  <AlertTriangle size={16} />
                  {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar contrato'}
                </button>
              )}
              <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}
                style={{
                  padding: '13px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                  color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 10,
                }}>
                <RefreshCw size={16} className={generateMutation.isPending ? 'animate-spin' : ''} />
                {generateMutation.isPending ? 'Gerando...' : 'Gerar 12 mensalidades'}
              </button>
            </div>
          </div>
        </>
      )}

      <div style={{ padding: '20px 20px 0' }}>
        {/* Status banner */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderRadius: 14, marginBottom: 12,
          background: `color-mix(in srgb, ${statusColor} 10%, transparent)`,
          border: `1px solid color-mix(in srgb, ${statusColor} 25%, transparent)`,
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>Contrato</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', marginTop: 2 }}>
              {c.number}
            </div>
          </div>
          <span style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
            background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
            color: statusColor,
          }}>
            {STATUS_LABEL[c.status as ContractStatus]}
          </span>
        </div>

        {/* Plano */}
        {c.plan && (
          <div style={{
            background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16,
            padding: 16, marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{c.plan.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                  ↓ {c.plan.downloadSpeed}Mbps · ↑ {c.plan.uploadSpeed}Mbps
                </div>
              </div>
              <div className="mono" style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700, color: 'var(--t1)' }}>
                {fmt(c.monthlyValue)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: 'Vencimento', value: `Dia ${c.dueDay}` },
                { label: 'Fidelidade', value: `${c.fidelityMonths}m` },
                { label: 'Desconto', value: fmt(c.discount || 0) },
              ].map((item) => (
                <div key={item.label} style={{
                  flex: 1, background: 'var(--s2)', borderRadius: 10, border: '1px solid var(--bd)',
                  padding: '8px 10px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 2 }}>{item.label}</div>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--t2)' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cliente */}
        {c.customer && (
          <button
            onClick={() => navigate(`/customers/${c.customer.id}`)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 14,
              background: 'var(--s1)', border: '1px solid var(--bd)',
              color: 'var(--t1)', cursor: 'pointer', marginBottom: 12, textAlign: 'left',
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'var(--s3)', border: '1px solid var(--bd)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User size={16} style={{ color: 'var(--t2)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{c.customer.name}</div>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>Ver detalhe do cliente</div>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--t3)' }} />
          </button>
        )}

        {/* Datas */}
        <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16, padding: '0 16px', marginBottom: 12 }}>
          <InfoRow icon={<Calendar size={15} />} label="Data de início"
            value={new Date(c.startDate).toLocaleDateString('pt-BR')} />
          {c.activationDate && (
            <InfoRow icon={<Calendar size={15} />} label="Data de ativação"
              value={new Date(c.activationDate).toLocaleDateString('pt-BR')} />
          )}
          {c.fidelityEndDate && (
            <InfoRow icon={<Calendar size={15} />} label="Fim da fidelidade"
              value={new Date(c.fidelityEndDate).toLocaleDateString('pt-BR')} />
          )}
          <div style={{ height: 1 }} />
        </div>

        {/* Ações rápidas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <button
            onClick={() => navigate(`/receivables/new?contractId=${id}&customerId=${c.customerId}`)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 14,
              background: 'var(--success-dim)', border: '1px solid rgba(34,197,94,0.25)',
              color: 'var(--success)', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Plus size={18} />
              Nova cobrança manual
            </div>
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 14,
              background: 'var(--accent-dim)', border: '1px solid var(--accent)',
              color: 'var(--accent)', cursor: generateMutation.isPending ? 'default' : 'pointer',
              fontSize: 14, fontWeight: 500,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <DollarSign size={18} />
              {generateMutation.isPending ? 'Gerando mensalidades...' : 'Gerar 12 mensalidades'}
            </div>
            <RefreshCw size={16} className={generateMutation.isPending ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Histórico de cobranças */}
        <div style={{
          background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16, overflow: 'hidden',
        }}>
          {/* Section header */}
          <button
            onClick={() => setShowHistory((v) => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', background: 'var(--s2)', border: 'none',
              borderBottom: showHistory ? '1px solid var(--bd)' : 'none',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Receipt size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>
                Histórico de cobranças
              </span>
              {receivables.length > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                  background: 'var(--accent-dim)', color: 'var(--accent)',
                }}>
                  {receivables.length}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Mini summary badges */}
              {paidCount > 0 && (
                <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>{paidCount} pago</span>
              )}
              {overdueCount > 0 && (
                <span style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600 }}>{overdueCount} vencida</span>
              )}
              {pendingCount > 0 && !overdueCount && (
                <span style={{ fontSize: 11, color: 'var(--warn)', fontWeight: 600 }}>{pendingCount} pendente</span>
              )}
              <ChevronDown size={16} style={{
                color: 'var(--t3)',
                transform: showHistory ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s',
              }} />
            </div>
          </button>

          {showHistory && (
            <>
              {historyLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                  <div className="animate-spin" style={{
                    width: 24, height: 24, borderRadius: '50%',
                    border: '2px solid var(--bd)', borderTopColor: 'var(--accent)',
                  }} />
                </div>
              ) : receivables.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                  <DollarSign size={28} style={{ color: 'var(--t3)', marginBottom: 8 }} />
                  <div style={{ fontSize: 13, color: 'var(--t3)' }}>
                    Nenhuma cobrança gerada ainda.
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>
                    Use "Gerar 12 mensalidades" para criar o histórico anual.
                  </div>
                </div>
              ) : (
                <div>
                  {receivables.map((r: any, idx: number) => {
                    const rStatus = r.status as RStatus;
                    const rColor = R_COLOR[rStatus] || 'var(--t3)';
                    const isLast = idx === receivables.length - 1;
                    return (
                      <div
                        key={r.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 16px',
                          borderBottom: isLast ? 'none' : '1px solid var(--bd)',
                          borderLeft: `3px solid ${rColor}`,
                        }}
                      >
                        <RStatusIcon status={rStatus} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 2 }}>
                            {r.description}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                            Vence: {new Date(r.dueDate).toLocaleDateString('pt-BR')}
                            {r.paidDate && ` · Pago: ${new Date(r.paidDate).toLocaleDateString('pt-BR')}`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: rColor }}>
                            {fmt(Number(r.finalAmount))}
                          </div>
                          <div style={{
                            fontSize: 10, fontWeight: 600, color: rColor,
                            marginTop: 2,
                          }}>
                            {R_LABEL[rStatus]}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
