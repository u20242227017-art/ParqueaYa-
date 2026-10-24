import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTarifaDto } from './dto/create-tarifa.dto';
import { UpdateTarifaDto } from './dto/update-tarifa.dto';
import { Tarifa } from './entities/tarifa.entity';

@Injectable()
export class TarifasService {
  constructor(
    @InjectRepository(Tarifa)
    private readonly tarifasRepository: Repository<Tarifa>,
  ) {}

  create(createTarifaDto: CreateTarifaDto): Promise<Tarifa> {
    const tarifa = this.tarifasRepository.create({
      id: createTarifaDto.id,
      precioHora: String(createTarifaDto.precioHora),
      minutosGracia: createTarifaDto.minutosGracia,
    });
    return this.tarifasRepository.save(tarifa);
  }

  findAll(): Promise<Tarifa[]> {
    return this.tarifasRepository.find();
  }

  async findOne(id: number): Promise<Tarifa> {
    const tarifa = await this.tarifasRepository.findOneBy({ id });
    if (!tarifa) {
      throw new NotFoundException(`Tarifa ${id} no encontrada`);
    }
    return tarifa;
  }

  async update(id: number, updateTarifaDto: UpdateTarifaDto): Promise<Tarifa> {
    const tarifa = await this.findOne(id);
    const { precioHora, ...fields } = updateTarifaDto;
    Object.assign(tarifa, fields);
    if (precioHora !== undefined) {
      tarifa.precioHora = String(precioHora);
    }
    return this.tarifasRepository.save(tarifa);
  }

  async remove(id: number): Promise<void> {
    const tarifa = await this.findOne(id);
    await this.tarifasRepository.remove(tarifa);
  }
}
