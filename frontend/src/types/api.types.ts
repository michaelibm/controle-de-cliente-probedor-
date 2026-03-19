export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: string[];
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'FINANCIAL' | 'ATTENDANT' | 'SUPPORT' | 'READONLY';
export type CustomerStatus = 'ACTIVE' | 'BLOCKED' | 'SUSPENDED' | 'CANCELLED' | 'ACTIVATING';
export type CustomerType = 'INDIVIDUAL' | 'COMPANY';
export type DocumentType = 'CPF' | 'CNPJ';
export type ContractStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'PENDING_ACTIVATION';
export type PlanCategory = 'RESIDENTIAL' | 'BUSINESS' | 'ENTERPRISE';
export type ReceivableStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'RENEGOTIATED' | 'PARTIAL' | 'EXEMPT';
export type ReceivableType = 'MONTHLY' | 'INSTALL' | 'EQUIPMENT' | 'EXTRA' | 'RENEGOTIATED';
export type PaymentMethod = 'BOLETO' | 'PIX' | 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER' | 'DIRECT_DEBIT';
export type PayableStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface CustomerAddress {
  id: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  reference?: string;
}

export interface Customer {
  id: string;
  code: number;
  type: CustomerType;
  name: string;
  document: string;
  documentType: DocumentType;
  email?: string;
  phone: string;
  phoneSecondary?: string;
  whatsapp?: string;
  status: CustomerStatus;
  origin?: string;
  notes?: string;
  address?: CustomerAddress;
  seller?: { id: string; name: string };
  _count?: { contracts: number; receivables: number };
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  downloadSpeed: number;
  uploadSpeed: number;
  monthlyPrice: number;
  installFee: number;
  fidelityMonths: number;
  category: PlanCategory;
  isPromo: boolean;
  isActive: boolean;
  _count?: { contracts: number };
}

export interface Contract {
  id: string;
  number: string;
  customerId: string;
  customer?: { id: string; name: string; document: string; status: CustomerStatus };
  planId: string;
  plan?: { id: string; name: string; downloadSpeed: number; uploadSpeed: number };
  status: ContractStatus;
  monthlyValue: number;
  dueDay: number;
  discount: number;
  finePercent: number;
  interestPercent: number;
  fidelityMonths: number;
  startDate: string;
  activationDate?: string;
  fidelityEndDate?: string;
  cancellationDate?: string;
  notes?: string;
  createdAt: string;
}

export interface Receivable {
  id: string;
  code: string;
  customerId: string;
  customer?: { id: string; name: string; document: string };
  contractId?: string;
  contract?: { id: string; number: string; plan?: { name: string } };
  description: string;
  type: ReceivableType;
  status: ReceivableStatus;
  principalAmount: number;
  discount: number;
  fineAmount: number;
  interestAmount: number;
  finalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  issueDate: string;
  paidDate?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalActiveCustomers: number;
  totalDefaultingCustomers: number;
  defaultRate: number;
  totalReceivableMonth: number;
  totalReceivedMonth: number;
  totalOverdue: number;
  totalDueToday: number;
  totalDueNext7Days: number;
  pendingInvoicesCount: number;
  overdueInvoicesCount: number;
  averageTicket: number;
  collectionRate: number;
}
