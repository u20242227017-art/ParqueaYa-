import { OmitType, PartialType } from '@nestjs/mapped-types';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { CreateRegistroDto } from './create-registro.dto';
import { MetodoPago } from '../../pagos/entities/pago.entity';

export class UpdateRegistroDto extends PartialType(
  OmitType(CreateRegistroDto, ['puestoId'] as const),
) {
  @IsOptional()
  @IsDateString()
  horaSalida?: string | null;

  @IsOptional()
  @IsEnum(MetodoPago)
  metodo?: MetodoPago;

  @IsOptional()
  @IsString()
  @Matches(/^[1-9]\d*$/)
  administradorId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  montoConfirmado?: number;
}
