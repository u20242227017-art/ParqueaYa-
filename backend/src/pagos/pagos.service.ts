import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { Pago } from './entities/pago.entity';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private readonly pagosRepository: Repository<Pago>,
  ) {}

  create(createPagoDto: CreatePagoDto): Promise<Pago> {
    const pago = this.pagosRepository.create({
      registroId: createPagoDto.registroId,
      turnoCajaId: createPagoDto.turnoCajaId ?? null,
      monto: String(createPagoDto.monto),
      metodo: createPagoDto.metodo,
      estado: createPagoDto.estado,
    });
    return this.pagosRepository.save(pago);
  }

  findAll(): Promise<Pago[]> {
    return this.pagosRepository.find({
      relations: { registro: { puesto: true }, turnoCaja: true },
    });
  }

  async findOne(id: string): Promise<Pago> {
    const pago = await this.pagosRepository.findOne({
      where: { id },
      relations: { registro: { puesto: true }, turnoCaja: true },
    });
    if (!pago) {
      throw new NotFoundException(`Pago ${id} no encontrado`);
    }
    return pago;
  }

  async update(id: string, updatePagoDto: UpdatePagoDto): Promise<Pago> {
    const pago = await this.findOne(id);
    const { monto, ...fields } = updatePagoDto;
    Object.assign(pago, fields);
    if (monto !== undefined) {
      pago.monto = String(monto);
    }
    return this.pagosRepository.save(pago);
  }

  async remove(id: string): Promise<void> {
    const pago = await this.findOne(id);
    await this.pagosRepository.remove(pago);
  }
}
