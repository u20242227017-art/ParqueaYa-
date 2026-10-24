import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreateRegistroDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  placa: string;

  @IsInt()
  @Min(1)
  puestoId: number;
}
