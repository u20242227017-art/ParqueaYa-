import {
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class CreateCajaDto {
  @IsString()
  @Matches(/^[1-9]\d*$/)
  administradorId: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoInicial?: number;
}
