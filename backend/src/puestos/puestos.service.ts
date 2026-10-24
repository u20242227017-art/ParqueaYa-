import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePuestoDto } from './dto/create-puesto.dto';
import { UpdatePuestoDto } from './dto/update-puesto.dto';
import { Puesto } from './entities/puesto.entity';

@Injectable()
export class PuestosService {
  constructor(
    @InjectRepository(Puesto)
    private readonly puestosRepository: Repository<Puesto>,
  ) {}

  create(createPuestoDto: CreatePuestoDto): Promise<Puesto> {
    return this.puestosRepository.save(
      this.puestosRepository.create(createPuestoDto),
    );
  }

  findAll(): Promise<Puesto[]> {
    return this.puestosRepository.find();
  }

  async findOne(id: number): Promise<Puesto> {
    const puesto = await this.puestosRepository.findOneBy({ id });
    if (!puesto) {
      throw new NotFoundException(`Puesto ${id} no encontrado`);
    }
    return puesto;
  }

  async update(id: number, updatePuestoDto: UpdatePuestoDto): Promise<Puesto> {
    const puesto = await this.findOne(id);
    return this.puestosRepository.save(
      this.puestosRepository.merge(puesto, updatePuestoDto),
    );
  }

  async remove(id: number): Promise<void> {
    const puesto = await this.findOne(id);
    await this.puestosRepository.remove(puesto);
  }
}
