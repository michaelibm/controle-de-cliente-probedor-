import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhookService } from './webhook.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
