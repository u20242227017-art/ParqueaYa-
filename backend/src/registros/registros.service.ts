import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { UpdateRegistroDto } from './dto/update-registro.dto';
import { Registro } from './entities/registro.entity';
import { EstadoPuesto, Puesto } from '../puestos/entities/puesto.entity';

@Injectable()
export class RegistrosService {
  constructor(
    @InjectRepository(Registro)
    private readonly registrosRepository: Repository<Registro>,
    private readonly dataSource: DataSource,
  ) {}

  create(createRegistroDto: CreateRegistroDto): Promise<Registro> {
    return this.dataSource.transaction(async (manager) => {
      const puesto = await manager.findOne(Puesto, {
        where: { id: createRegistroDto.puestoId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!puesto) {
        throw new NotFoundException(
          `Puesto ${createRegistroDto.puestoId} no encontrado`,
        );
      }
      if (puesto.estado !== EstadoPuesto.LIBRE) {
        throw new ConflictException('El puesto seleccionado no está libre');
      }

      const registro = manager.getRepository(Registro).create(createRegistroDto);
      const savedRegistro = await manager.getRepository(Registro).save(registro);
      puesto.estado = EstadoPuesto.OCUPADO;
      await manager.getRepository(Puesto).save(puesto);
      return savedRegistro;
    });
  }

  findAll(): Promise<Registro[]> {
    return this.registrosRepository.find({ relations: { puesto: true } });
  }

  async findOne(id: string): Promise<Registro> {
    const registro = await this.registrosRepository.findOne({
      where: { id },
      relations: { puesto: true },
    });
    if (!registro) {
      throw new NotFoundException(`Registro ${id} no encontrado`);
    }
    return registro;
  }

  async update(
    id: string,
    updateRegistroDto: UpdateRegistroDto,
  ): Promise<Registro> {
    return this.dataSource.transaction(async (manager) => {
      const registro = await manager.findOne(Registro, {
        where: { id },
        relations: { puesto: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!registro) {
        throw new NotFoundException(`Registro ${id} no encontrado`);
      }

      const { horaSalida, ...fields } = updateRegistroDto;
      manager.getRepository(Registro).merge(registro, fields);
      if (horaSalida !== undefined) {
        const estabaActivo = registro.horaSalida === null;
        registro.horaSalida =
          horaSalida === null ? null : new Date(horaSalida);
        if (estabaActivo && horaSalida !== null) {
          registro.puesto.estado = EstadoPuesto.LIBRE;
          await manager.getRepository(Puesto).save(registro.puesto);
        }
      }
      return manager.getRepository(Registro).save(registro);
    });
  }

  async remove(id: string): Promise<void> {
    const registro = await this.findOne(id);
    await this.registrosRepository.remove(registro);
  }
}
