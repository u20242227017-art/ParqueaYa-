import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { EstadoPago, Pago } from './entities/pago.entity';
import { Registro } from '../registros/entities/registro.entity';
import { Tarifa } from '../tarifas/entities/tarifa.entity';
import { TurnoCaja } from '../caja/entities/caja.entity';
import { calcularCobro } from '../registros/billing';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private readonly pagosRepository: Repository<Pago>,
    private readonly dataSource: DataSource,
  ) {}

  create(createPagoDto: CreatePagoDto): Promise<Pago> {
    return this.dataSource.transaction(async (manager) => {
      const registro = await manager.findOne(Registro, {
        where: { id: createPagoDto.registroId },
        lock: { mode: 'pessimistic_read' },
      });
      if (!registro) {
        throw new NotFoundException(
          `Registro ${createPagoDto.registroId} no encontrado`,
        );
      }
      if (!registro.horaSalida) {
        throw new ConflictException(
          'No se puede crear un pago antes de registrar la salida del vehículo',
        );
      }
      if (createPagoDto.estado === EstadoPago.PAGADO) {
        throw new BadRequestException(
          'Los pagos confirmados se registran al cerrar la salida del vehículo',
        );
      }

      const tarifa = await manager.findOne(Tarifa, { where: { id: 1 } });
      if (!tarifa) {
        throw new NotFoundException('No hay una tarifa configurada');
      }
      const expected = calcularCobro(
        registro.horaEntrada,
        registro.horaSalida,
        tarifa.precioHora,
        tarifa.minutosGracia,
      );
      if (this.toCentavos(createPagoDto.monto) !== expected.monto * 100) {
        throw new BadRequestException(
          'El importe no coincide con la tarifa calculada por el servidor',
        );
      }

      const pago = manager.getRepository(Pago).create({
        registroId: createPagoDto.registroId,
        turnoCajaId: createPagoDto.turnoCajaId ?? null,
        monto: expected.montoDecimal,
        metodo: createPagoDto.metodo,
        estado: createPagoDto.estado ?? EstadoPago.PENDIENTE,
      });
      return manager.getRepository(Pago).save(pago);
    });
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
    return this.dataSource.transaction(async (manager) => {
      const pago = await manager.findOne(Pago, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!pago) {
        throw new NotFoundException(`Pago ${id} no encontrado`);
      }
      if (
        updatePagoDto.registroId !== undefined &&
        updatePagoDto.registroId !== pago.registroId
      ) {
        throw new BadRequestException('No se puede cambiar el registro del pago');
      }
      const registro = await manager.findOne(Registro, {
        where: { id: pago.registroId },
        lock: { mode: 'pessimistic_read' },
      });
      if (!registro) {
        throw new NotFoundException(`Registro ${pago.registroId} no encontrado`);
      }
      if (!registro.horaSalida) {
        throw new ConflictException(
          'El vehículo debe tener una salida registrada antes de cobrar',
        );
      }
      const tarifa = await manager.findOne(Tarifa, { where: { id: 1 } });
      if (!tarifa) {
        throw new NotFoundException('No hay una tarifa configurada');
      }
      const expected = calcularCobro(
        registro.horaEntrada,
        registro.horaSalida,
        tarifa.precioHora,
        tarifa.minutosGracia,
      );
      if (
        updatePagoDto.monto !== undefined &&
        this.toCentavos(updatePagoDto.monto) !== expected.monto * 100
      ) {
        throw new BadRequestException(
          'El importe no coincide con la tarifa calculada por el servidor',
        );
      }
      if (pago.estado === EstadoPago.PAGADO) {
        throw new ConflictException('Este pago ya fue confirmado');
      }

      if (updatePagoDto.estado === EstadoPago.PAGADO) {
        let turnoCajaId = updatePagoDto.turnoCajaId ?? pago.turnoCajaId;
        if (!turnoCajaId) {
          const turnoAbierto = await manager.getRepository(TurnoCaja).findOne({
            where: { cierre: IsNull() },
            order: { apertura: 'DESC' },
            lock: { mode: 'pessimistic_write' },
          });
          if (!turnoAbierto) {
            throw new ConflictException(
              'No hay un turno de caja abierto para registrar el pago',
            );
          }
          turnoCajaId = turnoAbierto.id;
        }
        pago.turnoCajaId = turnoCajaId;
      } else if (updatePagoDto.turnoCajaId !== undefined) {
        pago.turnoCajaId = updatePagoDto.turnoCajaId;
      }

      pago.monto = expected.montoDecimal;
      if (updatePagoDto.metodo !== undefined) {
        pago.metodo = updatePagoDto.metodo;
      }
      if (updatePagoDto.estado !== undefined) {
        pago.estado = updatePagoDto.estado;
      }
      return manager.getRepository(Pago).save(pago);
    });
  }

  async remove(id: string): Promise<void> {
    const pago = await this.findOne(id);
    await this.pagosRepository.remove(pago);
  }

  private toCentavos(value: number | string): number {
    const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));
    if (!match) {
      throw new BadRequestException('El importe debe ser un valor monetario válido');
    }
    return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  }
}
