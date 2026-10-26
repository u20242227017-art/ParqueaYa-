import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TipoVehiculo } from '../entities/registro.entity';

@ValidatorConstraint({ name: 'placaSegunTipoVehiculo', async: false })
class PlacaSegunTipoVehiculo implements ValidatorConstraintInterface {
  validate(placa: string, args: ValidationArguments): boolean {
    const { tipoVehiculo } = args.object as CreateRegistroDto;
    const formato =
      tipoVehiculo === TipoVehiculo.CARRO
        ? /^[A-Z]{3}\d{3}$/
        : tipoVehiculo === TipoVehiculo.MOTO
          ? /^[A-Z]{3}\d{2}[A-Z]$/
          : null;
    return formato?.test(placa) ?? false;
  }

  defaultMessage(args: ValidationArguments): string {
    const { tipoVehiculo } = args.object as CreateRegistroDto;
    return tipoVehiculo === TipoVehiculo.CARRO
      ? 'La placa del carro debe tener 3 letras seguidas de 3 números (ABC123)'
      : tipoVehiculo === TipoVehiculo.MOTO
        ? 'La placa de la moto debe tener 3 letras, 2 números y una letra (ABC12D)'
        : 'Selecciona si el vehículo es carro o moto';
  }
}

export class CreateRegistroDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Validate(PlacaSegunTipoVehiculo)
  placa: string;

  @IsEnum(TipoVehiculo)
  tipoVehiculo: TipoVehiculo;

  @IsInt()
  @Min(1)
  puestoId: number;
}
