import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuestosService } from './puestos.service';
import { PuestosController } from './puestos.controller';
import { Puesto } from './entities/puesto.entity';

@Module({
  imports : [TypeOrmModule.forFeature([Puesto])],
  controllers: [PuestosController],
  providers: [PuestosService],
})
export class PuestosModule {}
