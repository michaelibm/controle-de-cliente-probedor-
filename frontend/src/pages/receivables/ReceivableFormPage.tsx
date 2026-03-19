import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Check, Loader2, Search, X } from 'lucide-react';
import { receivablesService } from '../../services/receivables.service';
import { customersService } from '../../services/customers.service';
import { contractsService } from '../../services/contracts.service';
import type { Customer } from '../../types/api.types';

type FormData = {
  customerId: string;
  contractId?: string;
  description: string;
  type: string;
  principalAmount: number;
  discount: number;
  dueDate: string;
  notes?: string;
};

const TYPES = [
  { value: 'MONTHLY', label: 'Mensalidade' },
  { value: 'INSTALL', label: 'Instalação' },
  { value: 'EQUIPMENT', label: 'Equipamento' },
  { value: 'EXTRA', label: 'Extra' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  background: 'var(--s2)', border: '1px solid var(--bd)',
  color: 'var(--t1)', fontSize: 14,
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: 'var(--t2)', display: 'block', marginBottom: 6,
};

export function ReceivableFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();

  const preCustomerId = searchParams.get('customerId');
  const preContractId = searchParams.get('contractId');

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, setValue, watch } = useForm<FormData>({
    defaultValues: {
      type: 'MONTHLY',
      discount: 0,
      dueDate: new Date().toISOString().slice(0, 10),
      contractId: preContractId || undefined,
    },
  });

  // Load pre-selected customer
  const { data: preCustomer } = useQuery({
    queryKey: ['customer', preCustomerId],
    queryFn: () => customersService.getById(preCustomerId!),
    enabled: !!preCustomerId,
  });

  useEffect(() => {
    if (preCustomer && !selectedCustomer) {
      setSelectedCustomer(preCustomer);
      setValue('customerId', preCustomer.id);
    }
  }, [preCustomer, selectedCustomer, setValue]);

  // Load contracts for selected customer
  const { data: contractsData } = useQuery({
    queryKey: ['contracts', selectedCustomer?.id],
    queryFn: () => contractsService.findAll({ customerId: selectedCustomer!.id, status: 'ACTIVE', limit: 10 }),
    enabled: !!selectedCustomer,
  });

  // Customer search
  const { data: customerResults } = useQuery({
    queryKey: ['customers-search', customerSearch],
    queryFn: () => customersService.findAll({ search: customerSearch, limit: 6 }),
    enabled: customerSearch.length >= 2 && !selectedCustomer,
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => receivablesService.create({
      ...data,
      principalAmount: Number(data.principalAmount),
      discount: Number(data.discount || 0),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receivables'] });
      navigate('/receivables');
    },
    onError: (err: any) => {
      setServerError(err?.response?.data?.message || 'Erro ao criar cobrança');
    },
  });

  const onSubmit = (data: FormData) => {
    setServerError('');
    if (!selectedCustomer) { setServerError('Selecione um cliente'); return; }
    mutation.mutate({ ...data, customerId: selectedCustomer.id });
  };

  const contracts = contractsData?.items ?? [];

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
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>Nova Cobrança</div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Cobrança manual</div>
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

        {/* Cliente */}
        <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{
            padding: '13px 16px', borderBottom: '1px solid var(--bd)', background: 'var(--s2)',
            fontSize: 14, fontWeight: 600, color: 'var(--t1)', display: 'flex', justifyContent: 'space-between',
          }}>
            <span>Cliente *</span>
            {selectedCustomer && <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 500 }}>✓ Selecionado</span>}
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
                  <div style={{ fontSize: 12, color: 'var(--t3)' }}>#{selectedCustomer.code}</div>
                </div>
                {!preCustomerId && (
                  <button type="button" onClick={() => { setSelectedCustomer(null); setValue('customerId', ''); setValue('contractId', undefined); }}
                    style={{ color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <>
                <div style={{ position: 'relative', marginBottom: customerResults?.items.length ? 8 : 0 }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
                  <input value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Buscar cliente..." style={{ ...inputStyle, paddingLeft: 36 }} />
                </div>
                {customerResults && customerResults.items.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {customerResults.items.map((c) => (
                      <button key={c.id} type="button"
                        onClick={() => { setSelectedCustomer(c); setValue('customerId', c.id); setCustomerSearch(''); }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '11px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                          background: 'var(--s2)', border: '1px solid var(--bd)', color: 'var(--t1)', fontSize: 13,
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
              </>
            )}
          </div>
        </div>

        {/* Contrato (se houver contratos ativos) */}
        {selectedCustomer && contracts.length > 0 && (
          <div>
            <label style={labelStyle}>Vincular ao contrato (opcional)</label>
            <select {...register('contractId')} style={inputStyle}>
              <option value="">— Sem vínculo de contrato —</option>
              {contracts.map((ct: any) => (
                <option key={ct.id} value={ct.id}>
                  {ct.number} · {ct.plan?.name} · Dia {ct.dueDay}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Campos */}
        <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Tipo de cobrança</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {TYPES.map((t) => (
                <label key={t.value} style={{ cursor: 'pointer' }}>
                  <input {...register('type')} type="radio" value={t.value} style={{ display: 'none' }} />
                  <div style={{
                    padding: '10px', borderRadius: 10, textAlign: 'center',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    background: watch('type') === t.value ? 'var(--accent)' : 'var(--s2)',
                    color: watch('type') === t.value ? '#fff' : 'var(--t2)',
                    border: `1px solid ${watch('type') === t.value ? 'var(--accent)' : 'var(--bd)'}`,
                    transition: 'all 0.15s',
                  }}>
                    {t.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Descrição *</label>
            <input {...register('description', { required: true })} placeholder="Ex: Mensalidade Janeiro/2025"
              style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Valor (R$) *</label>
              <input {...register('principalAmount', { required: true, min: 0.01 })} type="number" step="0.01"
                placeholder="0,00" style={{ ...inputStyle, fontWeight: 600 }} />
            </div>
            <div>
              <label style={labelStyle}>Desconto (R$)</label>
              <input {...register('discount')} type="number" step="0.01" placeholder="0"
                style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Data de vencimento *</label>
            <input {...register('dueDate', { required: true })} type="date" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Observações</label>
            <textarea {...register('notes')} rows={2} placeholder="Notas..." style={{ ...inputStyle, resize: 'none' }} />
          </div>
        </div>

        <button type="submit" disabled={mutation.isPending || !selectedCustomer} style={{
          padding: '14px', borderRadius: 14,
          background: mutation.isPending || !selectedCustomer ? 'var(--s3)' : 'var(--success)',
          border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
          cursor: mutation.isPending || !selectedCustomer ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {mutation.isPending
            ? <><Loader2 size={18} className="animate-spin" /> Criando...</>
            : <><Check size={18} /> Criar Cobrança</>
          }
        </button>
      </form>
    </div>
  );
}
