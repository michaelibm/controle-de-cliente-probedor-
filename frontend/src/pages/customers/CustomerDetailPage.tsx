import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Edit, Phone, Mail, MapPin, Wifi, WifiOff,
  DollarSign, FileText, ChevronRight, AlertTriangle, Plus, Zap, Trash2, X,
} from 'lucide-react';
import { customersService } from '../../services/customers.service';
import type { CustomerStatus } from '../../types/api.types';

function fmt(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const STATUS_LABEL: Record<CustomerStatus, string> = {
  ACTIVE: 'Ativo', BLOCKED: 'Bloqueado', SUSPENDED: 'Suspenso',
  CANCELLED: 'Cancelado', ACTIVATING: 'Ativando',
};
const STATUS_COLOR: Record<CustomerStatus, string> = {
  ACTIVE: 'var(--success)', BLOCKED: 'var(--danger)', SUSPENDED: 'var(--warn)',
  CANCELLED: 'var(--t3)', ACTIVATING: 'var(--info)',
};

const STATUS_OPTIONS: { value: CustomerStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Ativar' },
  { value: 'BLOCKED', label: 'Bloquear' },
  { value: 'SUSPENDED', label: 'Suspender' },
  { value: 'CANCELLED', label: 'Cancelar' },
];

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0',
      borderBottom: '1px solid var(--bd)' }}>
      <span style={{ color: 'var(--t3)', marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, color: 'var(--t1)', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersService.getById(id!),
    enabled: !!id,
  });

  const { data: financial } = useQuery({
    queryKey: ['customer-financial', id],
    queryFn: () => customersService.getFinancialSummary(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: CustomerStatus) => customersService.updateStatus(id!, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', id] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      setShowStatusMenu(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => customersService.remove(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      navigate('/customers', { replace: true });
    },
  });

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div className="animate-spin" style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '2px solid var(--bd)', borderTopColor: 'var(--accent)',
      }} />
    </div>
  );

  if (!customer) return null;

  const statusColor = STATUS_COLOR[customer.status];
  const isActive = customer.status === 'ACTIVE';

  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{
        background: 'var(--s1)', borderBottom: '1px solid var(--bd)',
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
      }}>
        <button onClick={() => navigate(-1)} style={{
          width: 36, height: 36, borderRadius: 10, border: '1px solid var(--bd)',
          background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>Detalhe do Cliente</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate(`/customers/${id}/edit`)} style={{
            width: 36, height: 36, borderRadius: 10, border: '1px solid var(--bd)',
            background: 'var(--s2)', color: 'var(--t2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Edit size={16} />
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} style={{
            width: 36, height: 36, borderRadius: 10,
            border: '1px solid rgba(239,68,68,0.30)',
            background: 'var(--danger-dim)', color: 'var(--danger)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        {/* Profile card */}
        <div style={{
          background: 'var(--s1)', border: '1px solid var(--bd)',
          borderRadius: 20, padding: 20, marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              background: `color-mix(in srgb, ${statusColor} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${statusColor} 30%, transparent)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isActive ? <Wifi size={24} style={{ color: statusColor }} /> : <WifiOff size={24} style={{ color: statusColor }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', lineHeight: 1.2 }}>
                {customer.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>
                #{customer.code} · {customer.documentType}: {customer.document}
              </div>
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => setShowStatusMenu((v) => !v)}
                  style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${statusColor} 25%, transparent)`,
                    color: statusColor, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {STATUS_LABEL[customer.status]} <ChevronRight size={12} />
                </button>

                {showStatusMenu && (
                  <div style={{
                    position: 'absolute', marginTop: 4, zIndex: 20,
                    background: 'var(--s3)', border: '1px solid var(--bde)',
                    borderRadius: 12, overflow: 'hidden', minWidth: 150,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}>
                    {STATUS_OPTIONS.filter((o) => o.value !== customer.status).map((opt) => (
                      <button key={opt.value} onClick={() => statusMutation.mutate(opt.value)} style={{
                        width: '100%', padding: '11px 16px', display: 'block',
                        background: 'none', border: 'none', borderBottom: '1px solid var(--bd)',
                        color: STATUS_COLOR[opt.value], fontSize: 13, fontWeight: 500,
                        cursor: 'pointer', textAlign: 'left',
                      }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Financial summary */}
        {financial && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12,
          }}>
            {[
              { label: 'Total pago', value: fmt(financial.totalPaid), color: 'var(--success)' },
              { label: 'Em aberto', value: fmt(financial.totalPending), color: 'var(--warn)' },
              { label: 'Vencido', value: fmt(financial.totalOverdue), color: 'var(--danger)' },
              { label: 'Qtd. vencidas', value: String(financial.overdueCount), color: 'var(--danger)' },
            ].map((item) => (
              <div key={item.label} style={{
                background: 'var(--s1)', border: '1px solid var(--bd)',
                borderRadius: 12, padding: '12px 14px',
              }}>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: item.color }}>
                  {item.value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Contacts & address */}
        <div style={{
          background: 'var(--s1)', border: '1px solid var(--bd)',
          borderRadius: 16, padding: '0 16px', marginBottom: 12,
        }}>
          <InfoRow icon={<Phone size={15} />} label="Telefone" value={customer.phone} />
          <InfoRow icon={<Phone size={15} />} label="WhatsApp" value={customer.whatsapp} />
          <InfoRow icon={<Mail size={15} />} label="E-mail" value={customer.email} />
          {customer.address && (
            <InfoRow
              icon={<MapPin size={15} />}
              label="Endereço"
              value={`${customer.address.street}, ${customer.address.number}${customer.address.complement ? ` - ${customer.address.complement}` : ''}, ${customer.address.neighborhood}, ${customer.address.city} - ${customer.address.state}`}
            />
          )}
          <div style={{ height: 1 }} />
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => navigate(`/contracts/new?customerId=${id}`)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 14,
              background: 'var(--accent-dim)', border: '1px solid var(--accent)',
              color: 'var(--accent)', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Plus size={18} />
              Novo Contrato
            </div>
            <Zap size={16} />
          </button>

          <button
            onClick={() => navigate(`/contracts?customerId=${id}`)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 14,
              background: 'var(--s1)', border: '1px solid var(--bd)',
              color: 'var(--t1)', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap size={18} style={{ color: 'var(--accent)' }} />
              Ver contratos
            </div>
            <ChevronRight size={16} style={{ color: 'var(--t3)' }} />
          </button>

          <button
            onClick={() => navigate(`/receivables?customerId=${id}`)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 14,
              background: 'var(--s1)', border: '1px solid var(--bd)',
              color: 'var(--t1)', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <DollarSign size={18} style={{ color: 'var(--success)' }} />
              Ver cobranças
            </div>
            <ChevronRight size={16} style={{ color: 'var(--t3)' }} />
          </button>

          <button
            onClick={() => navigate(`/contracts?customerId=${id}`)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', borderRadius: 14,
              background: 'var(--s1)', border: '1px solid var(--bd)',
              color: 'var(--t1)', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={18} style={{ color: 'var(--accent)' }} />
              Ver contratos
            </div>
            <ChevronRight size={16} style={{ color: 'var(--t3)' }} />
          </button>

          {financial && financial.overdueCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 14,
              background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.25)',
              color: 'var(--danger)', fontSize: 13, fontWeight: 500,
            }}>
              <AlertTriangle size={16} />
              {financial.overdueCount} cobrança{financial.overdueCount > 1 ? 's' : ''} vencida{financial.overdueCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <>
          <div
            onClick={() => setShowDeleteConfirm(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 50 }}
          />
          <div className="slide-up" style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
            background: 'var(--s2)', border: '1px solid var(--bde)',
            borderRadius: '20px 20px 0 0',
            padding: '24px 20px calc(max(env(safe-area-inset-bottom), 16px) + 16px)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.30)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Trash2 size={18} style={{ color: 'var(--danger)' }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>Excluir cliente</div>
              </div>
              <button onClick={() => setShowDeleteConfirm(false)} style={{
                width: 32, height: 32, borderRadius: 8, background: 'var(--s3)',
                border: '1px solid var(--bd)', color: 'var(--t2)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={16} />
              </button>
            </div>

            <div style={{
              padding: '14px 16px', borderRadius: 12, marginBottom: 20,
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.20)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>
                {customer.name}
              </div>
              <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.5 }}>
                Esta ação irá excluir permanentemente o cliente e todo o histórico:
                contratos, cobranças e instalações.{' '}
                <strong style={{ color: 'var(--danger)' }}>Não pode ser desfeito.</strong>
              </div>
            </div>

            {deleteMutation.isError && (
              <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10,
                background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.25)',
                fontSize: 13, color: 'var(--danger)' }}>
                Erro ao excluir. Tente novamente.
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1, padding: '13px', borderRadius: 12,
                  background: 'var(--s3)', border: '1px solid var(--bd)',
                  color: 'var(--t2)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                style={{
                  flex: 1, padding: '13px', borderRadius: 12,
                  background: deleteMutation.isPending ? 'var(--s3)' : 'var(--danger)',
                  border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: deleteMutation.isPending ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {deleteMutation.isPending
                  ? 'Excluindo...'
                  : <><Trash2 size={16} /> Confirmar exclusão</>}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
