import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AsaasService } from './asaas.service';
import { AsaasWebhookController } from './asaas.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AsaasWebhookController],
  providers: [AsaasService],
  exports: [AsaasService],
})
export class AsaasModule {}
