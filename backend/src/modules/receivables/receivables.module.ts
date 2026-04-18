import { Module, forwardRef } from '@nestjs/common';
import { ReceivablesService } from './receivables.service';
import { ReceivablesController } from './receivables.controller';
import { AsaasModule } from '../asaas/asaas.module';

@Module({
  imports: [forwardRef(() => AsaasModule)],
  controllers: [ReceivablesController],
  providers: [ReceivablesService],
  exports: [ReceivablesService],
})
export class ReceivablesModule {}
