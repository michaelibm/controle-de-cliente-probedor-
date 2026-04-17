import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { format } from 'date-fns';

export interface AsaasCharge {
  id: string;
  invoiceUrl: string;
  bankSlipUrl: string | null;
  status: string;
}

export interface AsaasPixQrCode {
  encodedImage: string;
  payload: string;
  expirationDate: string;
}

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);

  constructor(private config: ConfigService) {}

  private get baseUrl(): string {
    return this.config.get<string>('ASAAS_BASE_URL', 'https://sandbox.asaas.com/api/v3');
  }

  private get apiKey(): string {
    return this.config.get<string>('ASAAS_API_KEY', '');
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      'access_token': this.apiKey,
    };
  }

  async findOrCreateCustomer(data: {
    name: string;
    cpfCnpj: string;
    email?: string | null;
    phone?: string | null;
  }): Promise<string> {
    if (!data.cpfCnpj) {
      throw new Error(`Cliente "${data.name}" não possui CPF/CNPJ cadastrado`);
    }

    const cpfCnpj = data.cpfCnpj.replace(/\D/g, '');
    if (cpfCnpj.length < 11) {
      throw new Error(`CPF/CNPJ inválido para "${data.name}": "${cpfCnpj}"`);
    }

    try {
      const searchResp = await fetch(
        `${this.baseUrl}/customers?cpfCnpj=${cpfCnpj}`,
        { headers: this.headers(), signal: AbortSignal.timeout(10000) },
      );
      if (searchResp.ok) {
        const searchData = await searchResp.json() as any;
        if (searchData.data?.length > 0) {
          this.logger.log(`Asaas: cliente existente ${searchData.data[0].id} para ${data.name}`);
          return searchData.data[0].id as string;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Asaas: erro ao buscar cliente: ${err?.message}`);
    }

    const createResp = await fetch(`${this.baseUrl}/customers`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        name: data.name,
        cpfCnpj,
        email: data.email ?? undefined,
        mobilePhone: data.phone?.replace(/\D/g, '') ?? undefined,
        notificationDisabled: false,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const customer = await createResp.json() as any;
    if (!createResp.ok || !customer.id) {
      throw new Error(
        `Asaas: falha ao criar cliente "${data.name}" — HTTP ${createResp.status}: ${JSON.stringify(customer?.errors ?? customer)}`,
      );
    }

    this.logger.log(`Asaas: cliente criado ${customer.id} para ${data.name}`);
    return customer.id as string;
  }

  async createCharge(data: {
    asaasCustomerId: string;
    value: number;
    dueDate: Date;
    description: string;
    externalReference: string;
  }): Promise<AsaasCharge> {
    const resp = await fetch(`${this.baseUrl}/payments`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        customer: data.asaasCustomerId,
        billingType: 'UNDEFINED', // permite boleto OU Pix — cliente escolhe
        value: data.value,
        dueDate: format(data.dueDate, 'yyyy-MM-dd'),
        description: data.description,
        externalReference: data.externalReference,
        daysAfterDueDateToRegistrationCancellation: 30,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const charge = await resp.json() as any;
    if (!resp.ok || !charge.id) {
      throw new Error(
        `Asaas: falha ao criar cobrança — HTTP ${resp.status}: ${JSON.stringify(charge?.errors ?? charge)}`,
      );
    }

    this.logger.log(`Asaas: cobrança criada ${charge.id} (R$ ${data.value})`);
    return charge as AsaasCharge;
  }

  async getPixQrCode(paymentId: string): Promise<AsaasPixQrCode | null> {
    try {
      const resp = await fetch(`${this.baseUrl}/payments/${paymentId}/pixQrCode`, {
        headers: this.headers(),
        signal: AbortSignal.timeout(10000),
      });
      if (!resp.ok) return null;
      return resp.json() as Promise<AsaasPixQrCode>;
    } catch {
      return null;
    }
  }

  async cancelCharge(paymentId: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        method: 'DELETE',
        headers: this.headers(),
        signal: AbortSignal.timeout(10000),
      });
      this.logger.log(`Asaas: cobrança cancelada ${paymentId}`);
    } catch (err: any) {
      this.logger.warn(`Asaas: erro ao cancelar cobrança ${paymentId}: ${err?.message}`);
    }
  }
}
