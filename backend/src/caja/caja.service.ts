import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateCajaDto } from './dto/create-caja.dto';
import { UpdateCajaDto } from './dto/update-caja.dto';
import { TurnoCaja } from './entities/caja.entity';
import { Pago, EstadoPago } from '../pagos/entities/pago.entity';

@Injectable()
export class CajaService {
  constructor(
    @InjectRepository(TurnoCaja)
    private readonly cajaRepository: Repository<TurnoCaja>,
    private readonly dataSource: DataSource,
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
    return this.dataSource.transaction(async (manager) => {
      const turnoRepository = manager.getRepository(TurnoCaja);
      const turno = await turnoRepository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!turno) {
        throw new NotFoundException(`Turno de caja ${id} no encontrado`);
      }

      const { montoInicial, montoFinal, cierre, ...fields } = updateCajaDto;
      Object.assign(turno, fields);
      if (montoInicial !== undefined) {
        turno.montoInicial = String(montoInicial);
      }
      if (cierre !== undefined && cierre !== null) {
        if (turno.cierre) {
          throw new ConflictException('El turno de caja ya está cerrado');
        }
        const pagos = await manager.getRepository(Pago).find({
          where: { turnoCajaId: turno.id, estado: EstadoPago.PAGADO },
        });
        const montoIngresosCentavos = pagos.reduce(
          (total, pago) => total + this.toCentavos(pago.monto),
          0,
        );
        const montoFinalCentavos =
          this.toCentavos(turno.montoInicial) + montoIngresosCentavos;
        turno.montoFinal = `${Math.floor(montoFinalCentavos / 100)}.${String(
          montoFinalCentavos % 100,
        ).padStart(2, '0')}`;
        turno.cierre = new Date(cierre);
      } else if (montoFinal !== undefined) {
        turno.montoFinal =
          montoFinal === null ? null : String(montoFinal);
      }
      return turnoRepository.save(turno);
    });
  }

  async remove(id: string): Promise<void> {
    const turno = await this.findOne(id);
    await this.cajaRepository.remove(turno);
  }

  private toCentavos(value: string): number {
    const [whole, fraction = ''] = String(value).split('.');
    return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
  }
}
