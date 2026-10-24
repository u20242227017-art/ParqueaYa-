import { PartialType } from '@nestjs/mapped-types';
import { CreateCajaDto } from './create-caja.dto';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateCajaDto extends PartialType(CreateCajaDto) {
  @IsOptional()
  @IsDateString()
  cierre?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoFinal?: number | null;
}
