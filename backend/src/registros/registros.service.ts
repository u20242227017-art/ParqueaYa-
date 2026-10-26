import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { UpdateRegistroDto } from './dto/update-registro.dto';
import { Registro } from './entities/registro.entity';
import { EstadoPuesto, Puesto } from '../puestos/entities/puesto.entity';
import { Pago, EstadoPago } from '../pagos/entities/pago.entity';
import { Tarifa } from '../tarifas/entities/tarifa.entity';
import { TurnoCaja } from '../caja/entities/caja.entity';
import { Administrador } from '../auth/entities/auth.entity';
import { calcularCobro } from './billing';

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

  async quote(id: string) {
    const registro = await this.findOne(id);
    if (registro.horaSalida) {
      throw new ConflictException('El registro ya tiene una salida registrada');
    }
    const tarifa = await this.dataSource.getRepository(Tarifa).findOneBy({
      id: 1,
    });
    if (!tarifa) {
      throw new NotFoundException('No hay una tarifa configurada');
    }

    const horaSalida = new Date();
    const cobro = calcularCobro(
      registro.horaEntrada,
      horaSalida,
      tarifa.precioHora,
      tarifa.minutosGracia,
    );
    return {
      registroId: registro.id,
      placa: registro.placa,
      puesto: registro.puesto.codigo,
      horaEntrada: registro.horaEntrada,
      horaSalida,
      tarifaPrecioHora: tarifa.precioHora,
      moneda: 'COP',
      ...cobro,
    };
  }

  async update(
    id: string,
    updateRegistroDto: UpdateRegistroDto,
  ): Promise<Registro> {
    if (updateRegistroDto.horaSalida !== undefined) {
      if (updateRegistroDto.horaSalida === null) {
        throw new BadRequestException(
          'La salida de un registro no se puede eliminar',
        );
      }
      return this.closeRegistration(id, updateRegistroDto);
    }

    return this.dataSource.transaction(async (manager) => {
      const registro = await manager.findOne(Registro, {
        where: { id },
        relations: { puesto: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!registro) {
        throw new NotFoundException(`Registro ${id} no encontrado`);
      }

      const {
        horaSalida: _horaSalida,
        metodo: _metodo,
        administradorId: _administradorId,
        montoConfirmado: _montoConfirmado,
        ...fields
      } = updateRegistroDto;
      manager.getRepository(Registro).merge(registro, fields);
      return manager.getRepository(Registro).save(registro);
    });
  }

  private async closeRegistration(
    id: string,
    updateRegistroDto: UpdateRegistroDto,
  ) {
    const metodo = updateRegistroDto.metodo;
    if (!metodo) {
      throw new BadRequestException(
        'Selecciona un método de pago para registrar la salida',
      );
    }
    if (!updateRegistroDto.administradorId) {
      throw new BadRequestException(
        'No se pudo identificar al administrador que registra el cobro',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const registro = await manager.findOne(Registro, {
        where: { id },
        relations: { puesto: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!registro) {
        throw new NotFoundException(`Registro ${id} no encontrado`);
      }
      if (registro.horaSalida) {
        throw new ConflictException('La salida de este registro ya fue cobrada');
      }

      const tarifa = await manager.findOne(Tarifa, {
        where: { id: 1 },
        lock: { mode: 'pessimistic_read' },
      });
      if (!tarifa) {
        throw new NotFoundException('No hay una tarifa configurada');
      }

      const horaSalida = new Date();
      const cobro = calcularCobro(
        registro.horaEntrada,
        horaSalida,
        tarifa.precioHora,
        tarifa.minutosGracia,
      );
      if (
        updateRegistroDto.montoConfirmado !== undefined &&
        updateRegistroDto.montoConfirmado !== cobro.monto
      ) {
        throw new ConflictException(
          'El total cambió desde la cotización. Actualiza el resumen antes de confirmar.',
        );
      }
      const pagosRepository = manager.getRepository(Pago);
      const pagoExistente = await pagosRepository.findOne({
        where: { registroId: registro.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (pagoExistente?.estado === EstadoPago.PAGADO) {
        throw new ConflictException(
          'Ya existe un pago confirmado para este registro',
        );
      }
      if (pagoExistente?.estado === EstadoPago.ANULADO) {
        throw new ConflictException(
          'El pago de este registro fue anulado y requiere revisión',
        );
      }

      const turnoCajaRepository = manager.getRepository(TurnoCaja);
      let turnoCaja = await turnoCajaRepository.findOne({
        where: { cierre: IsNull() },
        order: { apertura: 'DESC' },
        lock: { mode: 'pessimistic_write' },
      });
      if (!turnoCaja) {
        const administrador = await manager.findOne(Administrador, {
          where: { id: updateRegistroDto.administradorId },
        });
        if (!administrador || !administrador.activo) {
          throw new NotFoundException(
            'El administrador que registra el cobro no está disponible',
          );
        }
        turnoCaja = await turnoCajaRepository.save(
          turnoCajaRepository.create({
            administradorId: administrador.id,
            montoInicial: '0.00',
          }),
        );
      }

      const pago =
        pagoExistente ??
        pagosRepository.create({
          registroId: registro.id,
          turnoCajaId: turnoCaja.id,
        });
      pago.turnoCajaId = turnoCaja.id;
      pago.monto = cobro.montoDecimal;
      pago.metodo = metodo;
      pago.estado = EstadoPago.PAGADO;
      const pagoGuardado = await pagosRepository.save(pago);

      registro.horaSalida = horaSalida;
      await manager.getRepository(Registro).save(registro);
      registro.puesto.estado = EstadoPuesto.LIBRE;
      await manager.getRepository(Puesto).save(registro.puesto);

      return Object.assign(registro, {
        cobro: {
          ...cobro,
          tarifaPrecioHora: tarifa.precioHora,
          moneda: 'COP',
        },
        pago: pagoGuardado,
      });
    });
  }

  async remove(id: string): Promise<void> {
    const registro = await this.findOne(id);
    await this.registrosRepository.remove(registro);
  }
}
