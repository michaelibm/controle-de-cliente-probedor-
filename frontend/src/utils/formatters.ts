export function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
}

export function formatDocument(doc: string): string {
  const d = doc.replace(/\D/g, '');
  if (d.length === 11) {
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (d.length === 14) {
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return doc;
}

export function formatPhone(phone: string): string {
  const p = phone.replace(/\D/g, '');
  if (p.length === 11) return p.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (p.length === 10) return p.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return phone;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
}

export function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = today.getTime() - due.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function isOverdue(dueDate: string): boolean {
  return getDaysOverdue(dueDate) > 0;
}

export function isDueToday(dueDate: string): boolean {
  const due = new Date(dueDate);
  const today = new Date();
  return (
    due.getDate() === today.getDate() &&
    due.getMonth() === today.getMonth() &&
    due.getFullYear() === today.getFullYear()
  );
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo', BLOCKED: 'Bloqueado', SUSPENDED: 'Suspenso',
  CANCELLED: 'Cancelado', ACTIVATING: 'Em Ativação',
  PENDING: 'Pendente', PAID: 'Pago', OVERDUE: 'Vencido',
  RENEGOTIATED: 'Renegociado', PARTIAL: 'Parcial', EXEMPT: 'Isento',
  BOLETO: 'Boleto', PIX: 'PIX', CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão Crédito', DEBIT_CARD: 'Cartão Débito',
  TRANSFER: 'Transferência', DIRECT_DEBIT: 'Débito Automático',
  RESIDENTIAL: 'Residencial', BUSINESS: 'Empresarial', ENTERPRISE: 'Enterprise',
};

export function getLabel(key: string): string {
  return STATUS_LABELS[key] ?? key;
}
