import { Module, Global, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AsaasService } from './asaas.service';
import { AsaasWebhookController } from './asaas.controller';
import { AsaasSyncTask } from './asaas-sync.task';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReceivablesModule } from '../receivables/receivables.module';

@Global()
@Module({
  imports: [ConfigModule, PrismaModule, forwardRef(() => ReceivablesModule)],
  controllers: [AsaasWebhookController],
  providers: [AsaasService, AsaasSyncTask],
  exports: [AsaasService],
})
export class AsaasModule {}
