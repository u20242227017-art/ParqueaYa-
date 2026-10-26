import { Module } from '@nestjs/common';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pago } from './entities/pago.entity';
import { Registro } from '../registros/entities/registro.entity';
import { Tarifa } from '../tarifas/entities/tarifa.entity';
import { TurnoCaja } from '../caja/entities/caja.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pago, Registro, Tarifa, TurnoCaja])],
  controllers: [PagosController],
  providers: [PagosService],
})
export class PagosModule {}
