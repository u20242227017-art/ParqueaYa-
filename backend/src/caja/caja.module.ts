import { Module } from '@nestjs/common';
import { CajaService } from './caja.service';
import { CajaController } from './caja.controller';
import { TurnoCaja } from './entities/caja.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports : [TypeOrmModule.forFeature([TurnoCaja])],
  controllers: [CajaController],
  providers: [CajaService],
})
export class CajaModule {}
