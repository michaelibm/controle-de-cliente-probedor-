import { cn, getLabel } from '../../utils/formatters';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  ACTIVATING: 'bg-blue-100 text-blue-700 border-blue-200',
  BLOCKED: 'bg-red-100 text-red-700 border-red-200',
  SUSPENDED: 'bg-orange-100 text-orange-700 border-orange-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  PAID: 'bg-green-100 text-green-700 border-green-200',
  OVERDUE: 'bg-red-100 text-red-700 border-red-200',
  RENEGOTIATED: 'bg-purple-100 text-purple-700 border-purple-200',
  PARTIAL: 'bg-blue-100 text-blue-700 border-blue-200',
  EXEMPT: 'bg-slate-100 text-slate-500 border-slate-200',
  PENDING_ACTIVATION: 'bg-blue-100 text-blue-700 border-blue-200',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
      STATUS_COLORS[status] || 'bg-slate-100 text-slate-600 border-slate-200',
      className,
    )}>
      {getLabel(status)}
    </span>
  );
}
