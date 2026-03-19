import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly url = 'https://n8n.1rimanausti.com.br/webhook-test/internet';

  async send(event: string, data: Record<string, any>): Promise<void> {
    try {
      await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, timestamp: new Date().toISOString(), ...data }),
        signal: AbortSignal.timeout(5000),
      });
      this.logger.log(`Webhook OK: ${event}`);
    } catch (err: any) {
      this.logger.warn(`Webhook falhou [${event}]: ${err?.message}`);
    }
  }
}
