export interface CreateMpPreferenceCommand {
  orderId: string;
}

export interface MpPreferenceResult {
  initPoint: string;
}

export interface CreateMpPreferenceUseCase {
  execute(command: CreateMpPreferenceCommand): Promise<MpPreferenceResult>;
}
