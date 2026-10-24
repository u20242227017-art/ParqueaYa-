import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { EstadoPuesto } from '../entities/puesto.entity';

export class CreatePuestoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  codigo: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  piso?: number;

  @IsInt()
  @Min(1)
  fila: number;

  @IsInt()
  @Min(1)
  columna: number;

  @IsOptional()
  @IsEnum(EstadoPuesto)
  estado?: EstadoPuesto;
}
