import {
  Controller, Post, Body, Headers, Logger, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { ReceivableStatus, PaymentMethod } from '@prisma/client';

@Controller('webhooks/asaas')
export class AsaasWebhookController {
  private readonly logger = new Logger(AsaasWebhookController.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: any,
    @Headers('asaas-access-token') token: string,
  ) {
    const expectedToken = this.config.get<string>('ASAAS_WEBHOOK_TOKEN');
    if (expectedToken && token !== expectedToken) {
      this.logger.warn('Asaas webhook: token inválido');
      return { ok: false };
    }

    const { event, payment } = body ?? {};
    this.logger.log(`Asaas webhook recebido: ${event} | payment: ${payment?.id}`);

    if (!payment?.id) return { ok: true };

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      await this.handlePaymentConfirmed(payment);
    }

    if (event === 'PAYMENT_OVERDUE') {
      await this.prisma.receivable.updateMany({
        where: { asaasId: payment.id, status: ReceivableStatus.PENDING },
        data: { status: ReceivableStatus.OVERDUE },
      });
      this.logger.log(`Asaas: cobrança ${payment.id} marcada como OVERDUE`);
    }

    return { ok: true };
  }

  private async handlePaymentConfirmed(payment: any) {
    const receivable = await this.prisma.receivable.findFirst({
      where: { asaasId: payment.id, deletedAt: null },
    });

    if (!receivable) {
      this.logger.warn(`Asaas: cobrança ${payment.id} não encontrada no sistema`);
      return;
    }

    if (receivable.status === ReceivableStatus.PAID) {
      this.logger.log(`Asaas: cobrança ${payment.id} já está paga, ignorando`);
      return;
    }

    const paidValue = Number(payment.value ?? receivable.finalAmount);
    const newPaidAmount = Number(receivable.paidAmount) + paidValue;
    const newRemainingAmount = Number(receivable.finalAmount) - newPaidAmount;
    const newStatus = newRemainingAmount <= 0 ? ReceivableStatus.PAID : ReceivableStatus.PARTIAL;
    const paidAt = payment.paymentDate ? new Date(payment.paymentDate) : new Date();

    const paymentMethod: PaymentMethod =
      payment.billingType === 'PIX' ? PaymentMethod.PIX : PaymentMethod.BOLETO;

    const systemUser = await this.prisma.user.findFirst({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });

    await this.prisma.$transaction(async (tx) => {
      if (systemUser) {
        await tx.receivablePayment.create({
          data: {
            receivableId: receivable.id,
            amount: paidValue,
            paymentMethod,
            paidAt,
            notes: `Pagamento automático via Asaas (${payment.billingType ?? 'BOLETO'})`,
            registeredBy: systemUser.id,
          },
        });
      }

      await tx.receivable.update({
        where: { id: receivable.id },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: Math.max(0, newRemainingAmount),
          status: newStatus,
          paidDate: newStatus === ReceivableStatus.PAID ? paidAt : null,
          paymentMethod: newStatus === ReceivableStatus.PAID ? paymentMethod : receivable.paymentMethod,
        },
      });
    });

    this.logger.log(`Asaas: cobrança ${payment.id} → status ${newStatus} (R$ ${paidValue})`);
  }
}
