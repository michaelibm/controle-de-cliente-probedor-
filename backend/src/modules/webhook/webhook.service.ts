import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private config: ConfigService) {}

  private get url(): string {
    return this.config.get<string>('WEBHOOK_URL', 'https://n8n.1rimanausti.com.br/webhook-test/internet');
  }

  private get notificationsUrl(): string {
    return this.config.get<string>('WEBHOOK_URL_NOTIFICATIONS', 'https://n8n.1rimanausti.com.br/webhook-test/provedor');
  }

  async send(event: string, data: Record<string, any>): Promise<void> {
    await this._post(this.url, event, data);
  }

  async sendNotification(event: string, data: Record<string, any>): Promise<void> {
    await this._post(this.notificationsUrl, event, data);
  }

  private async _post(url: string, event: string, data: Record<string, any>): Promise<void> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, timestamp: new Date().toISOString(), ...data }),
        signal: AbortSignal.timeout(5000),
      });
      this.logger.log(`Webhook OK [${event}] → ${url}`);
    } catch (err: any) {
      this.logger.warn(`Webhook falhou [${event}]: ${err?.message}`);
    }
  }
}
