export interface ClearCartUseCase {
  execute(userId: string): Promise<void>;
}
