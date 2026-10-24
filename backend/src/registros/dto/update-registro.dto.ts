import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsOptional } from 'class-validator';
import { CreateRegistroDto } from './create-registro.dto';

export class UpdateRegistroDto extends PartialType(
  OmitType(CreateRegistroDto, ['puestoId'] as const),
) {
  @IsOptional()
  @IsDateString()
  horaSalida?: string | null;
}
