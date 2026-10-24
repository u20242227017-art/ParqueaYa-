import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCajaDto } from './dto/create-caja.dto';
import { UpdateCajaDto } from './dto/update-caja.dto';
import { TurnoCaja } from './entities/caja.entity';

@Injectable()
export class CajaService {
  constructor(
    @InjectRepository(TurnoCaja)
    private readonly cajaRepository: Repository<TurnoCaja>,
  ) {}

  create(createCajaDto: CreateCajaDto): Promise<TurnoCaja> {
    const turno = this.cajaRepository.create({
      administradorId: createCajaDto.administradorId,
      montoInicial: String(createCajaDto.montoInicial ?? 0),
    });
    return this.cajaRepository.save(turno);
  }

  findAll(): Promise<TurnoCaja[]> {
    return this.cajaRepository.find({ relations: { administrador: true } });
  }

  async findOne(id: string): Promise<TurnoCaja> {
    const turno = await this.cajaRepository.findOne({
      where: { id },
      relations: { administrador: true },
    });
    if (!turno) {
      throw new NotFoundException(`Turno de caja ${id} no encontrado`);
    }
    return turno;
  }

  async update(id: string, updateCajaDto: UpdateCajaDto): Promise<TurnoCaja> {
    const turno = await this.findOne(id);
    const { montoInicial, montoFinal, cierre, ...fields } = updateCajaDto;
    Object.assign(turno, fields);
    if (montoInicial !== undefined) {
      turno.montoInicial = String(montoInicial);
    }
    if (montoFinal !== undefined) {
      turno.montoFinal =
        montoFinal === null ? null : String(montoFinal);
    }
    if (cierre !== undefined) {
      turno.cierre = cierre === null ? null : new Date(cierre);
    }
    return this.cajaRepository.save(turno);
  }

  async remove(id: string): Promise<void> {
    const turno = await this.findOne(id);
    await this.cajaRepository.remove(turno);
  }
}
