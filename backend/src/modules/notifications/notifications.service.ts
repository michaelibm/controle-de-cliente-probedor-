import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';
import { startOfDay, endOfDay, addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private webhook: WebhookService,
  ) {}

  // Roda todo dia às 8h da manhã
  @Cron('0 8 * * *', { timeZone: 'America/Sao_Paulo' })
  async runDailyNotifications() {
    this.logger.log('Iniciando verificação de vencimentos...');
    await Promise.all([
      this.notifyDueToday(),
      this.notifyDueIn3Days(),
    ]);
    this.logger.log('Verificação de vencimentos concluída.');
  }

  async notifyDueToday() {
    const today = new Date();
    const receivables = await this.prisma.receivable.findMany({
      where: {
        dueDate: { gte: startOfDay(today), lte: endOfDay(today) },
        status: { in: ['PENDING', 'OVERDUE'] },
        deletedAt: null,
      },
      include: { customer: true },
    });

    this.logger.log(`Vencendo hoje: ${receivables.length} cobranças`);

    for (const r of receivables) {
      await this.webhook.sendNotification('receivable.due_today', {
        tipo: 'VENCIMENTO_HOJE',
        cobranca_id: r.id,
        codigo: r.code,
        descricao: r.description,
        valor: Number(r.finalAmount).toFixed(2),
        data_vencimento: format(new Date(r.dueDate), 'dd/MM/yyyy'),
        cliente: {
          id: r.customer?.id,
          nome: r.customer?.name,
          telefone: r.customer?.phone,
          whatsapp: r.customer?.whatsapp || r.customer?.phone,
          documento: r.customer?.document,
        },
        mensagem: `Olá ${r.customer?.name}, sua fatura de R$ ${Number(r.finalAmount).toFixed(2)} vence HOJE (${format(new Date(r.dueDate), 'dd/MM/yyyy', { locale: ptBR })}). Evite a interrupção do serviço realizando o pagamento.`,
      });
    }
  }

  async notifyDueIn3Days() {
    const target = addDays(new Date(), 3);
    const receivables = await this.prisma.receivable.findMany({
      where: {
        dueDate: { gte: startOfDay(target), lte: endOfDay(target) },
        status: { in: ['PENDING'] },
        deletedAt: null,
      },
      include: { customer: true },
    });

    this.logger.log(`Vencendo em 3 dias: ${receivables.length} cobranças`);

    for (const r of receivables) {
      await this.webhook.sendNotification('receivable.due_in_3_days', {
        tipo: 'AVISO_3_DIAS',
        cobranca_id: r.id,
        codigo: r.code,
        descricao: r.description,
        valor: Number(r.finalAmount).toFixed(2),
        data_vencimento: format(new Date(r.dueDate), 'dd/MM/yyyy'),
        cliente: {
          id: r.customer?.id,
          nome: r.customer?.name,
          telefone: r.customer?.phone,
          whatsapp: r.customer?.whatsapp || r.customer?.phone,
          documento: r.customer?.document,
        },
        mensagem: `Olá ${r.customer?.name}, sua fatura de R$ ${Number(r.finalAmount).toFixed(2)} vence em 3 dias (${format(new Date(r.dueDate), 'dd/MM/yyyy', { locale: ptBR })}). Realize o pagamento para evitar interrupção do serviço.`,
      });
    }
  }
}
