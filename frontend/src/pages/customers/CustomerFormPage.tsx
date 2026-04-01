import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Check, User, MapPin, Wrench, Zap } from 'lucide-react';
import { customersService } from '../../services/customers.service';
import { installationsService } from '../../services/installations.service';
import { plansService } from '../../services/plans.service';

const schema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  document: z.string().min(11, 'CPF/CNPJ inválido'),
  documentType: z.enum(['CPF', 'CNPJ']),
  type: z.enum(['INDIVIDUAL', 'COMPANY']),
  phone: z.string().min(10, 'Telefone inválido'),
  phoneSecondary: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  notes: z.string().optional(),
  address: z.object({
    zipCode: z.string().optional().or(z.literal('')),
    street: z.string().optional().or(z.literal('')),
    number: z.string().optional().or(z.literal('')),
    complement: z.string().optional(),
    neighborhood: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    state: z.string().optional().or(z.literal('')),
    reference: z.string().optional(),
  }).optional(),
});

type FormData = z.infer<typeof schema>;

type SectionProps = { title: string; icon: React.ReactNode; children: React.ReactNode; accent?: string };
function Section({ title, icon, children, accent = 'var(--accent)' }: SectionProps) {
  return (
    <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px', borderBottom: '1px solid var(--bd)',
        background: 'var(--s2)',
      }}>
        <span style={{ color: accent }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>{title}</span>
      </div>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  );
}

type FieldProps = { label: string; error?: string; required?: boolean; children: React.ReactNode };
function Field({ label, error, required, children }: FieldProps) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--t2)', marginBottom: 6 }}>
        {label}{required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  width: '100%', padding: '11px 14px', borderRadius: 10,
  background: 'var(--s2)', border: `1px solid ${hasError ? 'var(--danger)' : 'var(--bd)'}`,
  color: 'var(--t1)', fontSize: 14,
});
const selectStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  background: 'var(--s2)', border: '1px solid var(--bd)',
  color: 'var(--t1)', fontSize: 14,
};

export function CustomerFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const qc = useQueryClient();
  const [serverError, setServerError] = useState('');
  const [scheduleInstall, setScheduleInstall] = useState(false);
  const [installData, setInstallData] = useState({
    planId: '',
    technicianId: '',
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: '09:00',
    notes: '',
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'INDIVIDUAL', documentType: 'CPF' },
  });

  useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersService.getById(id!),
    enabled: isEdit,
    retry: false,
    // @ts-ignore
    onSuccess: (c: any) => {
      setValue('name', c.name);
      setValue('document', c.document);
      setValue('documentType', c.documentType);
      setValue('type', c.type);
      setValue('phone', c.phone);
      setValue('email', c.email ?? '');
      setValue('whatsapp', c.whatsapp ?? '');
      if (c.address) {
        setValue('address.zipCode', c.address.zipCode);
        setValue('address.street', c.address.street);
        setValue('address.number', c.address.number);
        setValue('address.complement', c.address.complement ?? '');
        setValue('address.neighborhood', c.address.neighborhood);
        setValue('address.city', c.address.city);
        setValue('address.state', c.address.state);
      }
    },
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansService.findAll({ limit: 100 }),
    enabled: scheduleInstall,
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['install-technicians'],
    queryFn: () => installationsService.getTechnicians(),
    enabled: scheduleInstall,
  });

  const activePlans = (plans as any[]).filter((p: any) => p.isActive);

  const installMutation = useMutation({
    mutationFn: (customerId: string) => installationsService.create({
      customerId,
      planId: installData.planId || undefined,
      technicianId: installData.technicianId || undefined,
      scheduledDate: installData.scheduledDate,
      scheduledTime: installData.scheduledTime,
      notes: installData.notes || undefined,
    }),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEdit ? customersService.update(id!, data) : customersService.create(data),
    onSuccess: async (c) => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      if (scheduleInstall && !isEdit) {
        try {
          await installMutation.mutateAsync(c.id);
          qc.invalidateQueries({ queryKey: ['installations'] });
        } catch {}
      }
      navigate(`/customers/${c.id}`);
    },
    onError: (err: any) => {
      setServerError(err?.response?.data?.message || 'Erro ao salvar cliente');
    },
  });

  const handleCepBlur = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setValue('address.street', data.logradouro);
        setValue('address.neighborhood', data.bairro);
        setValue('address.city', data.localidade);
        setValue('address.state', data.uf);
      }
    } catch {}
  };

  const onSubmit = (data: FormData) => {
    setServerError('');
    const payload = { ...data };
    if (payload.address && !payload.address.zipCode && !payload.address.street) {
      payload.address = undefined;
    }
    mutation.mutate(payload);
  };

  const isPending = mutation.isPending || installMutation.isPending;

  return (
    <div className="fade-in" style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 20px', background: 'var(--s1)',
        borderBottom: '1px solid var(--bd)',
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
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)' }}>
            {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>
            {isEdit ? 'Atualize os dados' : 'Preencha os dados do cliente'}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '16px 20px 0' }}>
        {serverError && (
          <div style={{
            marginBottom: 12, padding: '12px 16px', borderRadius: 12,
            background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.25)',
            fontSize: 13, color: 'var(--danger)',
          }}>
            {serverError}
          </div>
        )}

        {/* Tipo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          {[{ value: 'INDIVIDUAL', label: 'Pessoa Física' }, { value: 'COMPANY', label: 'Pessoa Jurídica' }].map((t) => (
            <label key={t.value} style={{ cursor: 'pointer' }}>
              <input {...register('type')} type="radio" value={t.value} style={{ display: 'none' }} />
              <div style={{
                padding: '12px', borderRadius: 12, textAlign: 'center',
                fontSize: 13, fontWeight: 500,
                background: 'var(--s1)', border: '1px solid var(--bd)', color: 'var(--t2)',
                cursor: 'pointer',
              }}>
                {t.label}
              </div>
            </label>
          ))}
        </div>

        <Section title="Dados Pessoais" icon={<User size={16} />}>
          <Field label="Nome completo" required error={errors.name?.message}>
            <input {...register('name')} placeholder="João da Silva" style={inputStyle(!!errors.name)} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Tipo doc." error={errors.documentType?.message}>
              <select {...register('documentType')} style={selectStyle}>
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
              </select>
            </Field>
            <Field label="CPF/CNPJ" required error={errors.document?.message}>
              <input {...register('document')} placeholder="000.000.000-00" style={inputStyle(!!errors.document)} />
            </Field>
          </div>
          <Field label="Telefone" required error={errors.phone?.message}>
            <input {...register('phone')} placeholder="(00) 90000-0000" style={inputStyle(!!errors.phone)} />
          </Field>
          <Field label="WhatsApp" error={errors.whatsapp?.message}>
            <input {...register('whatsapp')} placeholder="(00) 90000-0000" style={inputStyle()} />
          </Field>
          <Field label="E-mail" error={errors.email?.message}>
            <input {...register('email')} type="email" placeholder="cliente@email.com" style={inputStyle(!!errors.email)} />
          </Field>
          <Field label="Observações">
            <textarea {...register('notes')} rows={3} placeholder="Informações adicionais..."
              style={{ ...inputStyle(), resize: 'none' }} />
          </Field>
        </Section>

        <Section title="Endereço" icon={<MapPin size={16} />}>
          <Field label="CEP" error={errors.address?.zipCode?.message}>
            <input
              {...register('address.zipCode')}
              placeholder="00000-000"
              style={inputStyle(!!errors.address?.zipCode)}
              onBlur={(e) => handleCepBlur(e.target.value)}
            />
          </Field>
          <Field label="Rua" error={errors.address?.street?.message}>
            <input {...register('address.street')} placeholder="Rua das Flores" style={inputStyle(!!errors.address?.street)} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Número" error={errors.address?.number?.message}>
              <input {...register('address.number')} placeholder="123" style={inputStyle(!!errors.address?.number)} />
            </Field>
            <Field label="Complemento">
              <input {...register('address.complement')} placeholder="Apto 1" style={inputStyle()} />
            </Field>
          </div>
          <Field label="Bairro" error={errors.address?.neighborhood?.message}>
            <input {...register('address.neighborhood')} placeholder="Centro" style={inputStyle(!!errors.address?.neighborhood)} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 10 }}>
            <Field label="Cidade" error={errors.address?.city?.message}>
              <input {...register('address.city')} placeholder="São Paulo" style={inputStyle(!!errors.address?.city)} />
            </Field>
            <Field label="UF" error={errors.address?.state?.message}>
              <input {...register('address.state')} placeholder="SP" maxLength={2}
                style={{ ...inputStyle(!!errors.address?.state), textTransform: 'uppercase' }} />
            </Field>
          </div>
          <Field label="Referência">
            <input {...register('address.reference')} placeholder="Próximo à escola..." style={inputStyle()} />
          </Field>
        </Section>

        {/* Installation toggle — only on new customer */}
        {!isEdit && (
          <div style={{ marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setScheduleInstall((v) => !v)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: 14,
                background: scheduleInstall ? 'rgba(34,197,94,0.1)' : 'var(--s1)',
                border: `1px solid ${scheduleInstall ? 'rgba(34,197,94,0.35)' : 'var(--bd)'}`,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Wrench size={18} style={{ color: scheduleInstall ? 'var(--success)' : 'var(--t3)' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>
                    Gerar Ordem de Instalação
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 1 }}>
                    Agendar técnico e enviar para o n8n
                  </div>
                </div>
              </div>
              <div style={{
                width: 44, height: 24, borderRadius: 12,
                background: scheduleInstall ? 'var(--success)' : 'var(--s3)',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3,
                  left: scheduleInstall ? 23 : 3,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }} />
              </div>
            </button>
          </div>
        )}

        {/* Installation section */}
        {!isEdit && scheduleInstall && (
          <Section title="Ordem de Instalação" icon={<Wrench size={16} />} accent="var(--success)">
            {/* Plan selector */}
            <Field label="Plano de internet">
              <select
                value={installData.planId}
                onChange={(e) => setInstallData((d) => ({ ...d, planId: e.target.value }))}
                style={selectStyle}
              >
                <option value="">— Sem plano definido —</option>
                {activePlans.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ↓{p.downloadSpeed}Mbps · {Number(p.monthlyPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </option>
                ))}
              </select>
            </Field>

            {/* Technician */}
            <Field label="Técnico responsável">
              <select
                value={installData.technicianId}
                onChange={(e) => setInstallData((d) => ({ ...d, technicianId: e.target.value }))}
                style={selectStyle}
              >
                <option value="">— A definir —</option>
                {(technicians as any[]).map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </Field>

            {/* Date + Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Data *">
                <input
                  type="date"
                  value={installData.scheduledDate}
                  onChange={(e) => setInstallData((d) => ({ ...d, scheduledDate: e.target.value }))}
                  style={inputStyle()}
                />
              </Field>
              <Field label="Horário *">
                <input
                  type="time"
                  value={installData.scheduledTime}
                  onChange={(e) => setInstallData((d) => ({ ...d, scheduledTime: e.target.value }))}
                  style={inputStyle()}
                />
              </Field>
            </div>

            <Field label="Observações para o técnico">
              <textarea
                value={installData.notes}
                onChange={(e) => setInstallData((d) => ({ ...d, notes: e.target.value }))}
                rows={2}
                placeholder="Ex: portão azul, ligar antes de chegar..."
                style={{ ...inputStyle(), resize: 'none' }}
              />
            </Field>

            {/* n8n notification note */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 10,
              background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
              fontSize: 12, color: 'var(--t3)',
            }}>
              <Zap size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              A ordem será enviada automaticamente ao n8n com endereço, plano, data e horário.
            </div>
          </Section>
        )}

        <button type="submit" disabled={isPending} style={{
          width: '100%', padding: '14px', borderRadius: 14,
          background: isPending ? 'var(--s3)' : 'var(--accent)',
          border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
          cursor: isPending ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: isPending ? 'none' : '0 4px 20px var(--accent-glow)',
        }}>
          {isPending
            ? <><Loader2 size={18} className="animate-spin" /> {installMutation.isPending ? 'Criando O.S...' : 'Salvando...'}</>
            : <><Check size={18} /> {isEdit ? 'Salvar alterações' : scheduleInstall ? 'Cadastrar + Agendar Instalação' : 'Cadastrar cliente'}</>
          }
        </button>
      </form>
    </div>
  );
}
