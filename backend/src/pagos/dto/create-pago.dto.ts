import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  Min,
  IsNumber,
} from 'class-validator';
import { MetodoPago, EstadoPago } from '../entities/pago.entity';

export class CreatePagoDto {
  @IsString()
  @Matches(/^[1-9]\d*$/)
  registroId: string;

  @IsOptional()
  @IsString()
  @Matches(/^[1-9]\d*$/)
  turnoCajaId?: string | null;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monto: number;

  @IsEnum(MetodoPago)
  metodo: MetodoPago;

  @IsOptional()
  @IsEnum(EstadoPago)
  estado?: EstadoPago;
}
