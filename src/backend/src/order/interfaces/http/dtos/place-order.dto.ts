import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CheckoutItemDto {
  @IsString() @IsNotEmpty() productId: string;
  @IsString() @IsNotEmpty() productName: string;
  @IsString() @IsOptional() variantId?: string;
  @IsString() @IsOptional() variantName?: string;
  @IsObject() @IsOptional() cakeConfig?: Record<string, string>;
  @IsNumber() @Min(1) quantity: number;
  @IsNumber() @Min(1) unitPrice: number;
  @IsString() @IsOptional() imageUrl?: string;
}

export class PlaceOrderDto {
  @IsString() @IsNotEmpty() customerName: string;
  @IsString() @IsNotEmpty() customerPhone: string;
  @IsEmail() customerEmail: string;

  @IsEnum(['PICKUP', 'DELIVERY']) deliveryType: 'PICKUP' | 'DELIVERY';

  @ValidateIf((o) => o.deliveryType === 'DELIVERY')
  @IsString()
  @IsNotEmpty()
  deliveryStreet?: string;

  @ValidateIf((o) => o.deliveryType === 'DELIVERY')
  @IsString()
  @IsNotEmpty()
  deliveryCity?: string;

  @IsString() @IsOptional() deliveryNotes?: string;

  @IsEnum(['BANK_TRANSFER', 'PSE', 'CARD', 'MERCADOPAGO']) paymentMethod: 'BANK_TRANSFER' | 'PSE' | 'CARD' | 'MERCADOPAGO';

  @IsString() @IsOptional() couponCode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];
}
