import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  TrendingUp, TrendingDown, ArrowDownLeft, Wallet, Plus, X,
  CheckCircle, AlertTriangle, Clock, Search, Filter, ChevronDown,
  Receipt, ShoppingCart,
} from 'lucide-react';
import { financialService } from '../../services/financial.service';
import { payablesService } from '../../services/payables.service';

function fmt(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const PAYMENT_METHODS = [
  { value: 'PIX', label: 'PIX' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'CREDIT_CARD', label: 'Cartão Crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão Débito' },
  { value: 'TRANSFER', label: 'Transferência' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  background: 'var(--s2)', border: '1px solid var(--bd)',
  color: 'var(--t1)', fontSize: 14,
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: 'var(--t2)', display: 'block', marginBottom: 6,
};

/* ---- Summary Tab ---- */
function ResumoTab() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: () => financialService.getSummary(),
  });

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
      <div className="animate-spin" style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '2px solid var(--bd)', borderTopColor: 'var(--accent)',
      }} />
    </div>
  );

  if (!summary) return null;
  const isPositive = summary.netBalance >= 0;

  return (
    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Period label */}
      <div style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center' }}>
        Referência: {summary.period.start} — {summary.period.end}
      </div>

      {/* Net balance card */}
      <div style={{
        background: isPositive
          ? 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%)'
          : 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)',
        border: `1px solid ${isPositive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        borderRadius: 20, padding: '20px 20px',
      }}>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 6 }}>Saldo líquido do mês</div>
        <div className="mono" style={{
          fontSize: 32, fontWeight: 800,
          color: isPositive ? 'var(--success)' : 'var(--danger)',
        }}>
          {fmt(summary.netBalance)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 6 }}>
          {isPositive ? '▲ Positivo' : '▼ Negativo'} este mês
        </div>
      </div>

      {/* Income / Expenses / Withdrawals grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Recebido', value: summary.totalReceived, color: 'var(--success)', icon: <TrendingUp size={16} /> },
          { label: 'Despesas pagas', value: summary.totalExpenses, color: 'var(--danger)', icon: <TrendingDown size={16} /> },
          { label: 'Retiradas', value: summary.totalWithdrawals, color: 'var(--warn)', icon: <ArrowDownLeft size={16} /> },
          { label: 'A receber', value: summary.pendingReceivables, color: 'var(--info)', icon: <Receipt size={16} /> },
        ].map((item) => (
          <div key={item.label} style={{
            background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 14, padding: '14px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ color: item.color }}>{item.icon}</span>
              <span style={{ fontSize: 11, color: 'var(--t3)' }}>{item.label}</span>
            </div>
            <div className="mono" style={{ fontSize: 17, fontWeight: 700, color: item.color }}>
              {fmt(item.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {summary.overdueReceivablesCount > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', borderRadius: 12,
            background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.25)',
            color: 'var(--danger)', fontSize: 13, fontWeight: 500,
          }}>
            <AlertTriangle size={15} />
            {summary.overdueReceivablesCount} cobrança(s) a receber vencidas
          </div>
        )}
        {summary.overduePayablesCount > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', borderRadius: 12,
            background: 'var(--warn-dim)', border: '1px solid rgba(245,158,11,0.25)',
            color: 'var(--warn)', fontSize: 13, fontWeight: 500,
          }}>
            <AlertTriangle size={15} />
            {summary.overduePayablesCount} despesa(s) vencidas
          </div>
        )}
        {summary.pendingPayablesCount > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', borderRadius: 12,
            background: 'var(--s1)', border: '1px solid var(--bd)',
            color: 'var(--t2)', fontSize: 13,
          }}>
            <Clock size={15} />
            {summary.pendingPayablesCount} despesa(s) a pagar · {fmt(summary.pendingPayables)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Statement Tab ---- */
function ExtratoTab() {
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['financial-statement', typeFilter, startDate, endDate],
    queryFn: () => financialService.getStatement({
      type: typeFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      limit: 60,
    }),
  });

  const items: any[] = (data as any)?.items ?? [];

  const typeColors: Record<string, string> = {
    income: 'var(--success)',
    expense: 'var(--danger)',
    withdrawal: 'var(--warn)',
  };
  const typeLabels: Record<string, string> = {
    income: 'Entrada', expense: 'Saída', withdrawal: 'Retirada',
  };
  const typeIcons: Record<string, React.ReactNode> = {
    income: <TrendingUp size={14} />,
    expense: <TrendingDown size={14} />,
    withdrawal: <ArrowDownLeft size={14} />,
  };

  return (
    <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Filters */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 14, padding: 14 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {[
            { value: '', label: 'Todos' },
            { value: 'income', label: 'Entradas' },
            { value: 'expense', label: 'Saídas' },
            { value: 'withdrawal', label: 'Retiradas' },
          ].map((f) => (
            <button key={f.value} onClick={() => setTypeFilter(f.value)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              background: typeFilter === f.value ? 'var(--accent)' : 'var(--s2)',
              color: typeFilter === f.value ? '#fff' : 'var(--t2)',
              border: `1px solid ${typeFilter === f.value ? 'var(--accent)' : 'var(--bd)'}`,
            }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={labelStyle}>De</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...inputStyle, fontSize: 13 }} />
          </div>
          <div>
            <label style={labelStyle}>Até</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ ...inputStyle, fontSize: 13 }} />
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <div className="animate-spin" style={{
            width: 24, height: 24, borderRadius: '50%',
            border: '2px solid var(--bd)', borderTopColor: 'var(--accent)',
          }} />
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t3)', fontSize: 13 }}>
          Nenhum lançamento no período
        </div>
      ) : (
        <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16, overflow: 'hidden' }}>
          {items.map((item: any, idx: number) => {
            const color = typeColors[item.type] || 'var(--t2)';
            const isLast = idx === items.length - 1;
            const sign = item.type === 'income' ? '+' : '-';
            return (
              <div key={item.id + idx} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderBottom: isLast ? 'none' : '1px solid var(--bd)',
                borderLeft: `3px solid ${color}`,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: `color-mix(in srgb, ${color} 12%, transparent)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color,
                }}>
                  {typeIcons[item.type]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.description}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
                    {new Date(item.date).toLocaleDateString('pt-BR')}
                    {item.paymentMethod && ` · ${item.paymentMethod}`}
                  </div>
                </div>
                <div className="mono" style={{
                  fontSize: 15, fontWeight: 700, color, flexShrink: 0,
                }}>
                  {sign}{fmt(item.amount)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---- Add Payable Modal ---- */
function AddPayableModal({ onClose, categories, onSuccess }: {
  onClose: () => void;
  categories: any[];
  onSuccess: () => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      supplier: '', categoryId: '', description: '',
      amount: '', dueDate: new Date().toISOString().slice(0, 10),
      costCenter: '', notes: '', isRecurring: false,
    },
  });
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: any) => payablesService.create({
      ...data,
      amount: Number(data.amount),
      isRecurring: false,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payables'] });
      qc.invalidateQueries({ queryKey: ['financial-summary'] });
      onSuccess();
    },
  });

  const onSubmit = (data: any) => mutation.mutate(data);

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
        maxHeight: '92vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>Nova Despesa</div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--s3)',
            border: '1px solid var(--bd)', color: 'var(--t2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mutation.isError && (
            <div style={{ padding: '10px 14px', borderRadius: 10,
              background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.25)',
              fontSize: 13, color: 'var(--danger)' }}>
              Erro ao criar despesa. Tente novamente.
            </div>
          )}

          <div>
            <label style={labelStyle}>Fornecedor / Origem *</label>
            <input {...register('supplier', { required: true })} placeholder="Ex: Provedor de IP, Energia..."
              style={{ ...inputStyle, borderColor: errors.supplier ? 'var(--danger)' : undefined }} />
          </div>

          <div>
            <label style={labelStyle}>Categoria *</label>
            <select {...register('categoryId', { required: true })} style={inputStyle}>
              <option value="">— Selecionar —</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Descrição *</label>
            <input {...register('description', { required: true })} placeholder="Ex: Fatura março..."
              style={{ ...inputStyle, borderColor: errors.description ? 'var(--danger)' : undefined }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Valor (R$) *</label>
              <input {...register('amount', { required: true, min: 0.01 })} type="number" step="0.01"
                placeholder="0,00"
                style={{ ...inputStyle, fontWeight: 600, borderColor: errors.amount ? 'var(--danger)' : undefined }} />
            </div>
            <div>
              <label style={labelStyle}>Vencimento *</label>
              <input {...register('dueDate', { required: true })} type="date" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Centro de custo</label>
            <input {...register('costCenter')} placeholder="Ex: Infraestrutura..." style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Observações</label>
            <textarea {...register('notes')} rows={2} placeholder="Notas..." style={{ ...inputStyle, resize: 'none' }} />
          </div>

          <button type="submit" disabled={mutation.isPending} style={{
            padding: '14px', borderRadius: 12,
            background: mutation.isPending ? 'var(--s3)' : 'var(--danger)',
            border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: mutation.isPending ? 'default' : 'pointer',
          }}>
            {mutation.isPending ? 'Criando...' : 'Criar Despesa'}
          </button>
        </form>
      </div>
    </>
  );
}

/* ---- Pay Payable Modal ---- */
function PayPayableModal({ payable, onClose, onSuccess }: { payable: any; onClose: () => void; onSuccess: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      amount: String(payable.amount),
      paymentMethod: 'PIX',
      paidAt: new Date().toISOString().slice(0, 10),
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => payablesService.pay(payable.id, {
      amount: Number(data.amount),
      paymentMethod: data.paymentMethod,
      paidAt: data.paidAt,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payables'] });
      qc.invalidateQueries({ queryKey: ['financial-summary'] });
      qc.invalidateQueries({ queryKey: ['financial-statement'] });
      onSuccess();
    },
  });

  const onSubmit = (data: any) => mutation.mutate(data);

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
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>Pagar Despesa</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{payable.description}</div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--s3)',
            border: '1px solid var(--bd)', color: 'var(--t2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Valor pago (R$)</label>
            <input {...register('amount')} type="number" step="0.01"
              style={{ ...inputStyle, fontSize: 18, fontWeight: 700 }} />
          </div>
          <div>
            <label style={labelStyle}>Forma de pagamento</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {PAYMENT_METHODS.map((m) => (
                <label key={m.value} style={{ cursor: 'pointer' }}>
                  <input {...register('paymentMethod')} type="radio" value={m.value} style={{ display: 'none' }} />
                  <div style={{
                    padding: '9px 6px', borderRadius: 9, textAlign: 'center',
                    fontSize: 11, fontWeight: 500, background: 'var(--s1)',
                    border: '1px solid var(--bd)', color: 'var(--t2)', cursor: 'pointer',
                  }}>
                    {m.label}
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Data do pagamento</label>
            <input {...register('paidAt')} type="date" style={inputStyle} />
          </div>
          <button type="submit" disabled={mutation.isPending} style={{
            padding: '13px', borderRadius: 12,
            background: mutation.isPending ? 'var(--s3)' : 'var(--success)',
            border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: mutation.isPending ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {mutation.isPending ? 'Registrando...' : <><CheckCircle size={16} /> Confirmar Pagamento</>}
          </button>
        </form>
      </div>
    </>
  );
}

/* ---- Despesas Tab ---- */
function DespesasTab() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dueDateStart, setDueDateStart] = useState('');
  const [dueDateEnd, setDueDateEnd] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [paying, setPaying] = useState<any | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['payable-categories'],
    queryFn: () => payablesService.getCategories(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['payables', search, statusFilter, dueDateStart, dueDateEnd],
    queryFn: () => payablesService.findAll({
      search: search || undefined,
      status: statusFilter || undefined,
      dueDateStart: dueDateStart || undefined,
      dueDateEnd: dueDateEnd || undefined,
      limit: 50,
    }),
  });

  const items: any[] = (data as any)?.items ?? [];

  const P_STATUS_COLOR: Record<string, string> = {
    PENDING: 'var(--warn)', PAID: 'var(--success)',
    OVERDUE: 'var(--danger)', CANCELLED: 'var(--t3)',
  };
  const P_STATUS_LABEL: Record<string, string> = {
    PENDING: 'Pendente', PAID: 'Pago', OVERDUE: 'Vencida', CANCELLED: 'Cancelada',
  };

  return (
    <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 80 }}>
      {/* Search + filter toggle */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar despesa..."
            style={{ ...inputStyle, paddingLeft: 32, fontSize: 13 }} />
        </div>
        <button onClick={() => setShowFilters((v) => !v)} style={{
          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
          background: showFilters ? 'var(--accent)' : 'var(--s2)',
          border: `1px solid ${showFilters ? 'var(--accent)' : 'var(--bd)'}`,
          color: showFilters ? '#fff' : 'var(--t2)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Filter size={16} />
        </button>
      </div>

      {/* Status filter chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[
          { value: '', label: 'Todas' },
          { value: 'PENDING', label: 'Pendente' },
          { value: 'OVERDUE', label: 'Vencida' },
          { value: 'PAID', label: 'Pago' },
        ].map((f) => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            whiteSpace: 'nowrap', cursor: 'pointer',
            background: statusFilter === f.value ? 'var(--accent)' : 'var(--s2)',
            color: statusFilter === f.value ? '#fff' : 'var(--t2)',
            border: `1px solid ${statusFilter === f.value ? 'var(--accent)' : 'var(--bd)'}`,
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Date filters */}
      {showFilters && (
        <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 12, padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={labelStyle}>Vencimento de</label>
              <input type="date" value={dueDateStart} onChange={(e) => setDueDateStart(e.target.value)} style={{ ...inputStyle, fontSize: 12 }} />
            </div>
            <div>
              <label style={labelStyle}>Até</label>
              <input type="date" value={dueDateEnd} onChange={(e) => setDueDateEnd(e.target.value)} style={{ ...inputStyle, fontSize: 12 }} />
            </div>
          </div>
          {(dueDateStart || dueDateEnd) && (
            <button onClick={() => { setDueDateStart(''); setDueDateEnd(''); }} style={{
              marginTop: 8, fontSize: 12, color: 'var(--danger)', background: 'none',
              border: 'none', cursor: 'pointer',
            }}>
              Limpar datas
            </button>
          )}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <div className="animate-spin" style={{
            width: 24, height: 24, borderRadius: '50%',
            border: '2px solid var(--bd)', borderTopColor: 'var(--accent)',
          }} />
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t3)', fontSize: 13 }}>
          <ShoppingCart size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
          Nenhuma despesa encontrada
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((p: any) => {
            const color = P_STATUS_COLOR[p.status] || 'var(--t2)';
            const canPay = ['PENDING', 'OVERDUE'].includes(p.status);
            return (
              <div key={p.id} style={{
                background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 14,
                overflow: 'hidden', borderLeft: `3px solid ${color}`,
              }}>
                <div style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>{p.description}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                        {p.supplier}
                        {p.category && ` · ${p.category.name}`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
                        Vence: {new Date(p.dueDate).toLocaleDateString('pt-BR')}
                        {p.paidDate && ` · Pago: ${new Date(p.paidDate).toLocaleDateString('pt-BR')}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div className="mono" style={{ fontSize: 16, fontWeight: 700, color }}>
                        {fmt(Number(p.amount))}
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                        background: `color-mix(in srgb, ${color} 12%, transparent)`, color,
                      }}>
                        {P_STATUS_LABEL[p.status]}
                      </span>
                    </div>
                  </div>
                  {canPay && (
                    <button onClick={() => setPaying(p)} style={{
                      marginTop: 10, width: '100%', padding: '9px', borderRadius: 9,
                      background: 'var(--success-dim)', border: '1px solid rgba(34,197,94,0.25)',
                      color: 'var(--success)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      <CheckCircle size={14} /> Registrar pagamento
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setShowAdd(true)} style={{
        position: 'fixed', bottom: 'calc(var(--nav-h) + 16px)', right: 20,
        width: 52, height: 52, borderRadius: 16,
        background: 'var(--danger)', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(239,68,68,0.4)', zIndex: 20,
      }}>
        <Plus size={22} style={{ color: '#fff' }} />
      </button>

      {showAdd && (
        <AddPayableModal
          categories={categories}
          onClose={() => setShowAdd(false)}
          onSuccess={() => setShowAdd(false)}
        />
      )}
      {paying && (
        <PayPayableModal
          payable={paying}
          onClose={() => setPaying(null)}
          onSuccess={() => setPaying(null)}
        />
      )}
    </div>
  );
}

/* ---- Cash Withdrawal Modal ---- */
function AddWithdrawalModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      amount: '',
      description: '',
      withdrawnAt: new Date().toISOString().slice(0, 10),
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => financialService.createWithdrawal({
      amount: Number(data.amount),
      description: data.description,
      withdrawnAt: data.withdrawnAt,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-withdrawals'] });
      qc.invalidateQueries({ queryKey: ['financial-summary'] });
      qc.invalidateQueries({ queryKey: ['financial-statement'] });
      onSuccess();
    },
  });

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
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>Retirada de Caixa</div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--s3)',
            border: '1px solid var(--bd)', color: 'var(--t2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mutation.isError && (
            <div style={{ padding: '10px 14px', borderRadius: 10,
              background: 'var(--danger-dim)', fontSize: 13, color: 'var(--danger)' }}>
              Erro. Tente novamente.
            </div>
          )}
          <div>
            <label style={labelStyle}>Valor (R$) *</label>
            <input {...register('amount', { required: true, min: 0.01 })} type="number" step="0.01"
              placeholder="0,00"
              style={{ ...inputStyle, fontSize: 20, fontWeight: 700, borderColor: errors.amount ? 'var(--danger)' : undefined }} />
          </div>
          <div>
            <label style={labelStyle}>Motivo / Descrição *</label>
            <input {...register('description', { required: true })} placeholder="Ex: Pagamento de funcionário, despesa pessoal..."
              style={{ ...inputStyle, borderColor: errors.description ? 'var(--danger)' : undefined }} />
          </div>
          <div>
            <label style={labelStyle}>Data</label>
            <input {...register('withdrawnAt', { required: true })} type="date" style={inputStyle} />
          </div>
          <button type="submit" disabled={mutation.isPending} style={{
            padding: '14px', borderRadius: 12,
            background: mutation.isPending ? 'var(--s3)' : 'var(--warn)',
            border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: mutation.isPending ? 'default' : 'pointer',
          }}>
            {mutation.isPending ? 'Registrando...' : 'Registrar Retirada'}
          </button>
        </form>
      </div>
    </>
  );
}

/* ---- Caixa Tab ---- */
function CaixaTab() {
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['cash-withdrawals'],
    queryFn: () => financialService.getWithdrawals({ limit: 50 }),
  });

  const items: any[] = (data as any)?.items ?? [];

  return (
    <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 80 }}>
      {/* Header card */}
      <div style={{
        background: 'var(--warn-dim)', border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: 16, padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>Retiradas de caixa</div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: 'var(--warn)', marginTop: 4 }}>
            {items.reduce((s, w) => s + Number(w.amount), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{items.length} retirada(s) no histórico</div>
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'rgba(245,158,11,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Wallet size={22} style={{ color: 'var(--warn)' }} />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <div className="animate-spin" style={{
            width: 24, height: 24, borderRadius: '50%',
            border: '2px solid var(--bd)', borderTopColor: 'var(--accent)',
          }} />
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t3)', fontSize: 13 }}>
          <Wallet size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
          Nenhuma retirada registrada
        </div>
      ) : (
        <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16, overflow: 'hidden' }}>
          {items.map((w: any, idx: number) => (
            <div key={w.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '13px 16px',
              borderBottom: idx < items.length - 1 ? '1px solid var(--bd)' : 'none',
              borderLeft: '3px solid var(--warn)',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'var(--warn-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ArrowDownLeft size={16} style={{ color: 'var(--warn)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {w.description}
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>
                  {new Date(w.withdrawnAt).toLocaleDateString('pt-BR')} · {w.code}
                </div>
              </div>
              <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--warn)', flexShrink: 0 }}>
                -{fmt(Number(w.amount))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setShowAdd(true)} style={{
        position: 'fixed', bottom: 'calc(var(--nav-h) + 16px)', right: 20,
        width: 52, height: 52, borderRadius: 16,
        background: 'var(--warn)', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(245,158,11,0.4)', zIndex: 20,
      }}>
        <Plus size={22} style={{ color: '#fff' }} />
      </button>

      {showAdd && (
        <AddWithdrawalModal onClose={() => setShowAdd(false)} onSuccess={() => setShowAdd(false)} />
      )}
    </div>
  );
}

/* ---- Main Page ---- */
const TABS = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'extrato', label: 'Extrato' },
  { id: 'despesas', label: 'Despesas' },
  { id: 'caixa', label: 'Caixa' },
];

export function FinanceiroPage() {
  const [tab, setTab] = useState('resumo');

  return (
    <div className="fade-in" style={{ paddingBottom: 16 }}>
      {/* Top bar */}
      <div style={{
        background: 'var(--s1)', borderBottom: '1px solid var(--bd)',
        position: 'sticky', top: 0, zIndex: 10, padding: '16px 20px 0',
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)', marginBottom: 14 }}>Financeiro</h1>
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '7px 18px', borderRadius: 20, whiteSpace: 'nowrap',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
              background: tab === t.id ? 'var(--accent)' : 'var(--s2)',
              color: tab === t.id ? '#fff' : 'var(--t2)',
              border: `1px solid ${tab === t.id ? 'var(--accent)' : 'var(--bd)'}`,
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'resumo' && <ResumoTab />}
      {tab === 'extrato' && <ExtratoTab />}
      {tab === 'despesas' && <DespesasTab />}
      {tab === 'caixa' && <CaixaTab />}
    </div>
  );
}
