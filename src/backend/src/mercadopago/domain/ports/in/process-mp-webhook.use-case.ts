export interface ProcessMpWebhookCommand {
  paymentId: string;
}

export interface ProcessMpWebhookUseCase {
  execute(command: ProcessMpWebhookCommand): Promise<void>;
}
