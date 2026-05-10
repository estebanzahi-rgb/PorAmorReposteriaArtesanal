import { IsArray, IsNumber, IsObject, IsOptional, IsPositive, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AnonymousCartItemDto {
  @IsString() productId: string;
  @IsString() productName: string;
  @IsOptional() @IsString() variantId?: string;
  @IsOptional() @IsString() variantName?: string;
  @IsOptional() @IsObject() cakeConfig?: Record<string, string>;
  @IsNumber() @Min(1) quantity: number;
  @IsNumber() @IsPositive() unitPrice: number;
  @IsOptional() @IsString() imageUrl?: string;
}

export class MergeCartDto {
  @ApiProperty({ type: [AnonymousCartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnonymousCartItemDto)
  anonymousItems: AnonymousCartItemDto[];
}
