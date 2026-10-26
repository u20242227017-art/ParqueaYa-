import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrosService } from './registros.service';
import { RegistrosController } from './registros.controller';
import { Registro } from './entities/registro.entity';
import { Puesto } from '../puestos/entities/puesto.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Tarifa } from '../tarifas/entities/tarifa.entity';
import { TurnoCaja } from '../caja/entities/caja.entity';
import { Administrador } from '../auth/entities/auth.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Registro,
      Puesto,
      Pago,
      Tarifa,
      TurnoCaja,
      Administrador,
    ]),
  ],
  controllers: [RegistrosController],
  providers: [RegistrosService],
})
export class RegistrosModule {}
