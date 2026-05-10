import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class SetProductDiscountDto {
  @IsInt() @Min(1) @Max(99) percentage: number;
  @IsDateString() startsAt: string;
  @IsDateString() endsAt: string;
}

export class SetQuantityRuleDto {
  @IsInt() @Min(2) minQuantity: number;
  @IsInt() @Min(1) @Max(99) percentage: number;
}

export class CreateCouponDto {
  @IsString() code: string;
  @IsEnum(['PERCENTAGE', 'FIXED_VALUE']) type: 'PERCENTAGE' | 'FIXED_VALUE';
  @IsNumber() @Min(1) value: number;
  @IsInt() @Min(1) @IsOptional() usageLimit?: number;
}
