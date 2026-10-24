import { IsInt, IsNumber, Min } from 'class-validator';

export class CreateTarifaDto {
  @IsInt()
  @Min(1)
  id: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioHora: number;

  @IsInt()
  @Min(0)
  minutosGracia: number;
}
