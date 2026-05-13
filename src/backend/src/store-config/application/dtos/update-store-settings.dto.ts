import { IsInt, Min, Max } from 'class-validator';

export class UpdateStoreSettingsDto {
  @IsInt()
  @Min(0)
  @Max(720)
  leadTimeHours: number;
}
