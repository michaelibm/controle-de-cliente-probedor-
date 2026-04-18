import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReceivablesService } from '../receivables/receivables.service';

@Injectable()
export class AsaasSyncTask {
  private readonly logger = new Logger(AsaasSyncTask.name);

  constructor(private readonly receivablesService: ReceivablesService) {}

  @Cron('0 */2 * * *')
  async syncPayments() {
    this.logger.log('Iniciando sincronização automática com Asaas...');
    const result = await this.receivablesService.syncWithAsaas();
    this.logger.log(`Sync Asaas: ${result.synced} pagamentos baixados, ${result.errors} erros`);
  }
}
