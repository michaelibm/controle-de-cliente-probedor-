import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Users, AlertTriangle,
  Clock, DollarSign, Wifi, ChevronRight, RefreshCw,
} from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service';
import { useAuthStore } from '../../store/auth.store';
import type { DashboardSummary } from '../../types/api.types';

function fmt(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}
function pct(val: number) { return `${val.toFixed(1)}%`; }

type StatProps = { label: string; value: string; sub?: string; color?: string; icon: React.ReactNode };

function StatCard({ label, value, sub, color = 'var(--accent)', icon }: StatProps) {
  return (
    <div style={{
      background: 'var(--s1)', border: '1px solid var(--bd)',
      borderRadius: 16, padding: 16, minWidth: 152, flex: '0 0 auto',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, marginBottom: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `color-mix(in srgb, ${color} 15%, transparent)`, color,
      }}>
        {icon}
      </div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--t1)', letterSpacing: -0.5 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 4, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

function AlertItem({ label, value, color, onClick }: { label: string; value: string; color: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '13px 16px', borderRadius: 12, cursor: 'pointer',
      background: `color-mix(in srgb, ${color} 10%, transparent)`,
      border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
    }}>
      <span style={{ fontSize: 13, color: 'var(--t1)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="mono" style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
        <ChevronRight size={14} style={{ color }} />
      </div>
    </button>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: summary, isLoading, refetch, isFetching } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
    refetchInterval: 60_000,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="fade-in" style={{ paddingBottom: 16 }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px 14px',
        background: 'var(--s1)', borderBottom: '1px solid var(--bd)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--t3)' }}>{greeting},</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--t1)', marginTop: 1 }}>
            {user?.name?.split(' ')[0] ?? 'Admin'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => refetch()} style={{
            width: 36, height: 36, borderRadius: 10, border: '1px solid var(--bd)',
            background: 'var(--s2)', color: 'var(--t2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
          </button>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            border: '1px solid var(--accent)', background: 'var(--accent-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Wifi size={16} style={{ color: 'var(--accent)' }} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <div className="animate-spin" style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '2px solid var(--bd)', borderTopColor: 'var(--accent)',
          }} />
        </div>
      ) : (
        <>
          {summary && (summary.overdueInvoicesCount > 0 || summary.totalDueToday > 0) && (
            <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
                Alertas
              </div>
              {summary.overdueInvoicesCount > 0 && (
                <AlertItem label={`${summary.overdueInvoicesCount} cobranças vencidas`}
                  value={fmt(summary.totalOverdue)} color="var(--danger)"
                  onClick={() => navigate('/receivables?status=OVERDUE')} />
              )}
              {summary.totalDueToday > 0 && (
                <AlertItem label="Vencem hoje" value={fmt(summary.totalDueToday)}
                  color="var(--warn)" onClick={() => navigate('/receivables?dueToday=true')} />
              )}
            </div>
          )}

          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
              Resumo do mês
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 20px 4px', scrollbarWidth: 'none' }}>
            <StatCard label="Recebido" value={fmt(summary?.totalReceivedMonth ?? 0)}
              sub={`de ${fmt(summary?.totalReceivableMonth ?? 0)}`} color="var(--success)" icon={<TrendingUp size={16} />} />
            <StatCard label="Inadimplência" value={pct(summary?.defaultRate ?? 0)}
              sub={`${summary?.totalDefaultingCustomers ?? 0} clientes`} color="var(--danger)" icon={<TrendingDown size={16} />} />
            <StatCard label="Ativos" value={String(summary?.totalActiveCustomers ?? 0)}
              color="var(--accent)" icon={<Users size={16} />} />
            <StatCard label="Ticket médio" value={fmt(summary?.averageTicket ?? 0)}
              color="var(--info)" icon={<DollarSign size={16} />} />
            <StatCard label="Vence em 7d" value={fmt(summary?.totalDueNext7Days ?? 0)}
              color="var(--warn)" icon={<Clock size={16} />} />
          </div>

          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 16, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--t2)' }}>Taxa de recebimento</span>
                <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>
                  {pct(summary?.collectionRate ?? 0)}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 6, background: 'var(--s3)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 6,
                  width: `${Math.min(summary?.collectionRate ?? 0, 100)}%`,
                  background: (summary?.collectionRate ?? 0) >= 80 ? 'var(--success)'
                    : (summary?.collectionRate ?? 0) >= 50 ? 'var(--warn)' : 'var(--danger)',
                  transition: 'width 0.8s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>{summary?.pendingInvoicesCount ?? 0} pendentes</span>
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>{summary?.overdueInvoicesCount ?? 0} vencidas</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
              Ações rápidas
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Novo cliente', icon: <Users size={18} />, to: '/customers/new', color: 'var(--accent)' },
                { label: 'Nova cobrança', icon: <DollarSign size={18} />, to: '/receivables/new', color: 'var(--success)' },
                { label: 'Ver vencidas', icon: <AlertTriangle size={18} />, to: '/receivables?status=OVERDUE', color: 'var(--danger)' },
                { label: 'Ver clientes', icon: <Users size={18} />, to: '/customers', color: 'var(--info)' },
              ].map(({ label, icon, to, color }) => (
                <button key={to} onClick={() => navigate(to)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', borderRadius: 12,
                  background: 'var(--s1)', border: '1px solid var(--bd)',
                  color: 'var(--t1)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                }}>
                  <span style={{ color }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
