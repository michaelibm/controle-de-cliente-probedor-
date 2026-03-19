import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Zap, X, Check, Loader2, Users } from 'lucide-react';
import { plansService } from '../../services/plans.service';
import type { Plan, PlanCategory } from '../../types/api.types';

function fmt(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const CAT_LABEL: Record<PlanCategory, string> = {
  RESIDENTIAL: 'Residencial', BUSINESS: 'Empresarial', ENTERPRISE: 'Enterprise',
};
const CAT_COLOR: Record<PlanCategory, string> = {
  RESIDENTIAL: 'var(--accent)', BUSINESS: 'var(--success)', ENTERPRISE: 'var(--warn)',
};

type PlanForm = {
  name: string; description?: string; category: PlanCategory;
  downloadSpeed: number; uploadSpeed: number;
  monthlyPrice: number; installFee: number; fidelityMonths: number;
};

function PlanCard({ plan, onToggle }: { plan: Plan; onToggle: () => void }) {
  const catColor = CAT_COLOR[plan.category];
  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--bd)',
      borderRadius: 16, overflow: 'hidden',
      borderTop: `3px solid ${plan.isActive ? catColor : 'var(--t3)'}`,
      opacity: plan.isActive ? 1 : 0.6,
    }}>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{plan.name}</div>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: `color-mix(in srgb, ${catColor} 12%, transparent)`, color: catColor,
              display: 'inline-block', marginTop: 4,
            }}>
              {CAT_LABEL[plan.category]}
            </span>
          </div>
          <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', textAlign: 'right' }}>
            {fmt(plan.monthlyPrice)}
            <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--t3)' }}>/mês</div>
          </div>
        </div>

        {/* Speed */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{
            flex: 1, padding: '8px 12px', borderRadius: 10,
            background: 'var(--s2)', border: '1px solid var(--bd)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 2 }}>↓ Download</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: catColor }}>
              {plan.downloadSpeed} <span style={{ fontSize: 10 }}>Mbps</span>
            </div>
          </div>
          <div style={{
            flex: 1, padding: '8px 12px', borderRadius: 10,
            background: 'var(--s2)', border: '1px solid var(--bd)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 2 }}>↑ Upload</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--t2)' }}>
              {plan.uploadSpeed} <span style={{ fontSize: 10 }}>Mbps</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--t3)', fontSize: 12 }}>
            <Users size={12} />
            {plan._count?.contracts ?? 0} contratos
          </div>
          <button onClick={onToggle} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: plan.isActive ? 'var(--danger-dim)' : 'var(--success-dim)',
            border: `1px solid ${plan.isActive ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
            color: plan.isActive ? 'var(--danger)' : 'var(--success)',
          }}>
            {plan.isActive ? 'Desativar' : 'Ativar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreatePlanModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PlanForm>({
    defaultValues: { category: 'RESIDENTIAL', fidelityMonths: 12, installFee: 0 },
  });

  const mutation = useMutation({
    mutationFn: (data: PlanForm) => plansService.create({
      ...data,
      downloadSpeed: Number(data.downloadSpeed),
      uploadSpeed: Number(data.uploadSpeed),
      monthlyPrice: Number(data.monthlyPrice),
      installFee: Number(data.installFee),
      fidelityMonths: Number(data.fidelityMonths),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      onClose();
    },
  });

  const onSubmit = (data: PlanForm) => mutation.mutateAsync(data).catch(() => {});

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    background: 'var(--s1)', border: '1px solid var(--bd)',
    color: 'var(--t1)', fontSize: 14,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 500, color: 'var(--t2)', display: 'block', marginBottom: 6,
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 50 }} />
      <div className="slide-up" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
        background: 'var(--s2)', border: '1px solid var(--bde)',
        borderRadius: '20px 20px 0 0',
        padding: '20px 20px calc(max(env(safe-area-inset-bottom), 16px) + 16px)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>Novo Plano</div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--s3)',
            border: '1px solid var(--bd)', color: 'var(--t2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} />
          </button>
        </div>

        {mutation.isError && (
          <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10,
            background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.25)',
            fontSize: 13, color: 'var(--danger)' }}>
            Erro ao criar plano. Verifique os dados.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Nome do plano *</label>
            <input {...register('name', { required: true })} placeholder="Fibra 100 Mega"
              style={{ ...inputStyle, borderColor: errors.name ? 'var(--danger)' : 'var(--bd)' }} />
          </div>

          <div>
            <label style={labelStyle}>Categoria</label>
            <select {...register('category')} style={inputStyle}>
              <option value="RESIDENTIAL">Residencial</option>
              <option value="BUSINESS">Empresarial</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Download (Mbps) *</label>
              <input {...register('downloadSpeed', { required: true, min: 1 })} type="number"
                placeholder="100" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Upload (Mbps) *</label>
              <input {...register('uploadSpeed', { required: true, min: 1 })} type="number"
                placeholder="50" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Mensalidade (R$) *</label>
              <input {...register('monthlyPrice', { required: true, min: 0 })} type="number" step="0.01"
                placeholder="89.90" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Taxa de instalação (R$)</label>
              <input {...register('installFee')} type="number" step="0.01"
                placeholder="0" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Fidelidade (meses)</label>
            <input {...register('fidelityMonths')} type="number"
              placeholder="12" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Descrição (opcional)</label>
            <input {...register('description')} placeholder="Internet fibra ótica residencial"
              style={inputStyle} />
          </div>

          <button type="submit" disabled={isSubmitting} style={{
            padding: '14px', borderRadius: 12,
            background: isSubmitting ? 'var(--s3)' : 'var(--accent)',
            border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: isSubmitting ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: isSubmitting ? 'none' : '0 4px 20px var(--accent-glow)',
          }}>
            {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Criando...</> : <><Check size={18} /> Criar plano</>}
          </button>
        </form>
      </div>
    </>
  );
}

export function PlansPage() {
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansService.findAll({ limit: 100 }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => plansService.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });

  return (
    <div className="fade-in" style={{ paddingBottom: 16 }}>
      {/* Header */}
      <div style={{
        background: 'var(--s1)', borderBottom: '1px solid var(--bd)',
        padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--t1)' }}>Planos</h1>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>{plans.length} planos cadastrados</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--accent-dim)', border: '1px solid var(--accent)',
          color: 'var(--accent)',
        }}>
          <Zap size={16} />
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{
              height: 160, borderRadius: 16, background: 'var(--s1)',
              border: '1px solid var(--bd)', opacity: 1 - i * 0.2,
            }} />
          ))
        ) : plans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--t3)' }}>
            <Zap size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: 14 }}>Nenhum plano cadastrado</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Crie o primeiro plano!</div>
          </div>
        ) : (
          plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onToggle={() => toggleMutation.mutate(plan.id)} />
          ))
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setShowCreate(true)} style={{
        position: 'fixed', bottom: 'calc(var(--nav-h) + 16px)', right: 20,
        width: 52, height: 52, borderRadius: 16,
        background: 'var(--accent)', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px var(--accent-glow)', zIndex: 20,
      }}>
        <Plus size={22} style={{ color: '#fff' }} />
      </button>

      {showCreate && <CreatePlanModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
