import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Search, X, Check, Loader2, Zap, User } from 'lucide-react';
import { contractsService } from '../../services/contracts.service';
import { customersService } from '../../services/customers.service';
import { plansService } from '../../services/plans.service';
import type { Customer, Plan } from '../../types/api.types';

type FormData = {
  customerId: string;
  planId: string;
  monthlyValue: number;
  dueDay: number;
  startDate: string;
  discount: number;
  fidelityMonths: number;
  finePercent: number;
  interestPercent: number;
  notes?: string;
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  background: 'var(--s2)', border: '1px solid var(--bd)',
  color: 'var(--t1)', fontSize: 14,
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: 'var(--t2)', display: 'block', marginBottom: 6,
};

export function ContractFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();

  const preCustomerId = searchParams.get('customerId');

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      dueDay: 7,
      discount: 0,
      fidelityMonths: 12,
      finePercent: 2,
      interestPercent: 1,
      startDate: new Date().toISOString().slice(0, 10),
    },
  });

  // Load pre-selected customer from URL param
  const { data: preCustomer } = useQuery({
    queryKey: ['customer', preCustomerId],
    queryFn: () => customersService.getById(preCustomerId!),
    enabled: !!preCustomerId && !selectedCustomer,
  });

  useEffect(() => {
    if (preCustomer && !selectedCustomer) {
      setSelectedCustomer(preCustomer);
      setValue('customerId', preCustomer.id);
    }
  }, [preCustomer, selectedCustomer, setValue]);

  // Customer search
  const { data: customerResults } = useQuery({
    queryKey: ['customers-search', customerSearch],
    queryFn: () => customersService.findAll({ search: customerSearch, limit: 6, status: 'ACTIVE' }),
    enabled: customerSearch.length >= 2 && !selectedCustomer,
  });

  // Load plans
  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansService.findAll({ limit: 100 }),
  });

  const activePlans = plans.filter((p) => p.isActive);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setValue('planId', plan.id);
    setValue('monthlyValue', plan.monthlyPrice);
    setValue('fidelityMonths', plan.fidelityMonths);
  };

  const mutation = useMutation({
    mutationFn: (data: FormData) => contractsService.create({
      ...data,
      monthlyValue: Number(data.monthlyValue),
      dueDay: Number(data.dueDay),
      discount: Number(data.discount),
      fidelityMonths: Number(data.fidelityMonths),
      finePercent: Number(data.finePercent),
      interestPercent: Number(data.interestPercent),
    }),
    onSuccess: (contract) => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['customers'] });
      navigate(`/contracts/${contract.id}`);
    },
    onError: (err: any) => {
      setServerError(err?.response?.data?.message || 'Erro ao criar contrato');
    },
  });

  const onSubmit = (data: FormData) => {
    setServerError('');
    if (!selectedCustomer) { setServerError('Selecione um cliente'); return; }
    if (!selectedPlan) { setServerError('Selecione um plano'); return; }
    mutation.mutate({ ...data, customerId: selectedCustomer.id, planId: selectedPlan.id });
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
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
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>Novo Contrato</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Vincule o cliente ao plano</div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {serverError && (
          <div style={{
            padding: '12px 16px', borderRadius: 12,
            background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.25)',
            fontSize: 13, color: 'var(--danger)',
          }}>
            {serverError}
          </div>
        )}

        {/* === CLIENTE === */}
        <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '13px 16px', borderBottom: '1px solid var(--bd)', background: 'var(--s2)',
          }}>
            <User size={15} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Cliente</span>
            {selectedCustomer && (
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--success)', fontWeight: 500 }}>
                ✓ Selecionado
              </span>
            )}
          </div>
          <div style={{ padding: 16 }}>
            {selectedCustomer ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: 12,
                background: 'var(--success-dim)', border: '1px solid rgba(34,197,94,0.25)',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{selectedCustomer.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)' }}>#{selectedCustomer.code} · {selectedCustomer.phone}</div>
                </div>
                {!preCustomerId && (
                  <button type="button" onClick={() => { setSelectedCustomer(null); setValue('customerId', ''); }}
                    style={{ color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <>
                <div style={{ position: 'relative', marginBottom: customerResults?.items.length ? 8 : 0 }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                  <input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Buscar cliente por nome ou CPF..."
                    style={{ ...inputStyle, paddingLeft: 36 }}
                  />
                </div>
                {customerResults && customerResults.items.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {customerResults.items.map((c) => (
                      <button key={c.id} type="button"
                        onClick={() => { setSelectedCustomer(c); setValue('customerId', c.id); setCustomerSearch(''); }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '11px 14px', borderRadius: 10,
                          background: 'var(--s2)', border: '1px solid var(--bd)',
                          color: 'var(--t1)', cursor: 'pointer', fontSize: 13, textAlign: 'left',
                        }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--t3)' }}>#{c.code}</div>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--success)' }}>Selecionar</span>
                      </button>
                    ))}
                  </div>
                )}
                {customerSearch.length >= 2 && customerResults?.items.length === 0 && (
                  <div style={{ fontSize: 13, color: 'var(--t3)', padding: '8px 0' }}>
                    Nenhum cliente ativo encontrado
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* === PLANO === */}
        <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '13px 16px', borderBottom: '1px solid var(--bd)', background: 'var(--s2)',
          }}>
            <Zap size={15} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Plano de Internet</span>
            {selectedPlan && (
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--success)', fontWeight: 500 }}>
                ✓ Selecionado
              </span>
            )}
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activePlans.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--t3)', padding: '8px 0' }}>Nenhum plano ativo disponível</div>
            ) : (
              activePlans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                return (
                  <button key={plan.id} type="button" onClick={() => handleSelectPlan(plan)} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                    borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                    background: isSelected ? 'var(--accent-dim)' : 'var(--s2)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--bd)'}`,
                    transition: 'all 0.15s',
                  }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                      background: isSelected ? 'var(--accent)' : 'var(--s3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isSelected ? '#fff' : 'var(--t3)',
                    }}>
                      <Zap size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{plan.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--t3)' }}>
                        ↓ {plan.downloadSpeed}Mbps · ↑ {plan.uploadSpeed}Mbps
                      </div>
                    </div>
                    <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: isSelected ? 'var(--accent)' : 'var(--t1)', flexShrink: 0 }}>
                      {plan.monthlyPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* === VALORES === */}
        {selectedPlan && (
          <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{
              padding: '13px 16px', borderBottom: '1px solid var(--bd)', background: 'var(--s2)',
              fontSize: 14, fontWeight: 600, color: 'var(--t1)',
            }}>
              Detalhes do Contrato
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Mensalidade (R$) *</label>
                  <input {...register('monthlyValue', { required: true, min: 0 })} type="number" step="0.01"
                    style={{ ...inputStyle, fontWeight: 600 }} />
                </div>
                <div>
                  <label style={labelStyle}>Desconto (R$)</label>
                  <input {...register('discount')} type="number" step="0.01" placeholder="0"
                    style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Dia de vencimento *</label>
                  <select {...register('dueDay', { required: true })} style={inputStyle}>
                    {[7, 20, 30].map((d) => (
                      <option key={d} value={d}>Dia {d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Data de início *</label>
                  <input {...register('startDate', { required: true })} type="date" style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Fidelidade (meses)</label>
                  <input {...register('fidelityMonths')} type="number" placeholder="12" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Multa (%)</label>
                  <input {...register('finePercent')} type="number" step="0.1" placeholder="2" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Juros ao mês (%)</label>
                <input {...register('interestPercent')} type="number" step="0.1" placeholder="1" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Observações</label>
                <textarea {...register('notes')} rows={2} placeholder="Notas do contrato..."
                  style={{ ...inputStyle, resize: 'none' }} />
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={mutation.isPending || !selectedCustomer || !selectedPlan} style={{
          padding: '14px', borderRadius: 14,
          background: !selectedCustomer || !selectedPlan || mutation.isPending ? 'var(--s3)' : 'var(--accent)',
          border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
          cursor: !selectedCustomer || !selectedPlan || mutation.isPending ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: !selectedCustomer || !selectedPlan || mutation.isPending ? 'none' : '0 4px 20px var(--accent-glow)',
        }}>
          {mutation.isPending
            ? <><Loader2 size={18} className="animate-spin" /> Criando contrato...</>
            : <><Check size={18} /> Criar Contrato</>
          }
        </button>
      </form>
    </div>
  );
}
