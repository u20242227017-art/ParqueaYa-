import { Module } from '@nestjs/common';
import { TarifasService } from './tarifas.service';
import { TarifasController } from './tarifas.controller';
import { Tarifa } from './entities/tarifa.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  imports: [TypeOrmModule.forFeature([Tarifa])],
  controllers: [TarifasController],
  providers: [TarifasService],
})
export class TarifasModule {}
