import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrosService } from './registros.service';
import { RegistrosController } from './registros.controller';
import { Registro } from './entities/registro.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Registro])],
  controllers: [RegistrosController],
  providers: [RegistrosService],
})
export class RegistrosModule {}
