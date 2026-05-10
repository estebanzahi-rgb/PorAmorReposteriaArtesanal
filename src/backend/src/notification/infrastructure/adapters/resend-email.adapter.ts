import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailPort, EmailNotification } from '../../domain/ports/out/email.port';

@Injectable()
export class ResendEmailAdapter implements EmailPort {
  private readonly logger = new Logger(ResendEmailAdapter.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('RESEND_API_KEY', '');
    this.fromEmail = this.configService.get<string>('OWNER_EMAIL', 'noreply@example.com');
  }

  async send(notification: EmailNotification): Promise<void> {
    if (!this.apiKey) {
      this.logger.log(
        `[DEV EMAIL] To: ${notification.to} | Subject: ${notification.subject}`,
      );
      return;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `PorAmor Repostería <${this.fromEmail}>`,
        to: [notification.to],
        subject: notification.subject,
        html: notification.html,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      this.logger.error(`Resend API error: ${JSON.stringify(body)}`);
    }
  }
}
