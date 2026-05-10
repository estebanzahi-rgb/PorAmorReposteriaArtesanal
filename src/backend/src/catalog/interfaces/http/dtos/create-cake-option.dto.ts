import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CakeDimension } from '../../../domain/entities/cake-option.entity';

export class CreateCakeOptionDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['SIZE', 'FLAVOR', 'FILLING', 'TOPPING', 'TOPPER'] })
  @IsEnum(['SIZE', 'FLAVOR', 'FILLING', 'TOPPING', 'TOPPER'])
  dimension: CakeDimension;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  priceModifier: number;
}
