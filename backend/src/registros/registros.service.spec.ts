import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RegistrosService } from './registros.service';
import { Registro, TipoVehiculo } from './entities/registro.entity';
import { EstadoPuesto, Puesto } from '../puestos/entities/puesto.entity';
import { Pago, EstadoPago, MetodoPago } from '../pagos/entities/pago.entity';
import { Tarifa } from '../tarifas/entities/tarifa.entity';
import { TurnoCaja } from '../caja/entities/caja.entity';

describe('RegistrosService', () => {
  let service: RegistrosService;
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    dataSource = { transaction: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrosService,
        { provide: getRepositoryToken(Registro), useValue: {} },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<RegistrosService>(RegistrosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('marks a free space occupied when a vehicle enters', async () => {
    const puesto = { id: 31, estado: EstadoPuesto.LIBRE };
    const registro = { id: '1', puestoId: puesto.id };
    const puestoRepository = { save: jest.fn().mockResolvedValue(puesto) };
    const registroRepository = {
      create: jest.fn().mockReturnValue(registro),
      save: jest.fn().mockResolvedValue(registro),
    };
    dataSource.transaction.mockImplementation(async (callback) =>
      callback({
        findOne: jest.fn().mockResolvedValue(puesto),
        getRepository: (entity: typeof Puesto | typeof Registro) =>
          entity === Puesto ? puestoRepository : registroRepository,
      }),
    );

    await service.create({
      placa: 'ABC123',
      tipoVehiculo: TipoVehiculo.CARRO,
      puestoId: puesto.id,
    });

    expect(registroRepository.save).toHaveBeenCalledWith(registro);
    expect(puesto.estado).toBe(EstadoPuesto.OCUPADO);
    expect(puestoRepository.save).toHaveBeenCalledWith(puesto);
  });

  it('marks the space free when a vehicle leaves', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-24T12:00:00.000Z'));
    const puesto = { id: 31, codigo: 'A1', estado: EstadoPuesto.OCUPADO };
    const registro = {
      id: '1',
      placa: 'ABC123',
      horaEntrada: new Date('2026-10-24T11:59:00.000Z'),
      puesto,
      horaSalida: null as Date | null,
    };
    const turnoCaja = { id: '9' };
    const pago = {};
    const puestoRepository = { save: jest.fn().mockResolvedValue(puesto) };
    const registroRepository = {
      save: jest.fn().mockResolvedValue(registro),
    };
    const pagoRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((fields) => fields),
      save: jest.fn().mockResolvedValue(pago),
    };
    const turnoCajaRepository = {
      findOne: jest.fn().mockResolvedValue(turnoCaja),
    };
    dataSource.transaction.mockImplementation(async (callback) =>
      callback({
        findOne: jest.fn((entity) => {
          if (entity === Registro) return Promise.resolve(registro);
          if (entity === Tarifa) {
            return Promise.resolve({ id: 1, precioHora: '5000.00', minutosGracia: 0 });
          }
          return Promise.resolve(turnoCaja);
        }),
        getRepository: (entity) => {
          if (entity === Puesto) return puestoRepository;
          if (entity === Registro) return registroRepository;
          if (entity === Pago) return pagoRepository;
          if (entity === TurnoCaja) return turnoCajaRepository;
          throw new Error(`Unexpected entity: ${entity}`);
        },
      }),
    );

    await service.update('1', {
      horaSalida: '2026-10-24T12:00:00.000Z',
      metodo: MetodoPago.EFECTIVO,
      administradorId: '1',
      montoConfirmado: 83,
    });

    expect(registro.horaSalida).toEqual(new Date('2026-10-24T12:00:00.000Z'));
    expect(puesto.estado).toBe(EstadoPuesto.LIBRE);
    expect(puestoRepository.save).toHaveBeenCalledWith(puesto);
    expect(pagoRepository.create).toHaveBeenCalledWith({
      registroId: '1',
      turnoCajaId: '9',
      monto: '83.00',
      metodo: MetodoPago.EFECTIVO,
      estado: EstadoPago.PAGADO,
    });
    expect(pagoRepository.save).toHaveBeenCalledWith({
      registroId: '1',
      turnoCajaId: '9',
      monto: '83.00',
      metodo: MetodoPago.EFECTIVO,
      estado: EstadoPago.PAGADO,
    });
    jest.useRealTimers();
  });
});
