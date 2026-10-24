import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RegistrosService } from './registros.service';
import { Registro } from './entities/registro.entity';
import { EstadoPuesto, Puesto } from '../puestos/entities/puesto.entity';

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

    await service.create({ placa: 'ABC123', puestoId: puesto.id });

    expect(registroRepository.save).toHaveBeenCalledWith(registro);
    expect(puesto.estado).toBe(EstadoPuesto.OCUPADO);
    expect(puestoRepository.save).toHaveBeenCalledWith(puesto);
  });

  it('marks the space free when a vehicle leaves', async () => {
    const puesto = { id: 31, estado: EstadoPuesto.OCUPADO };
    const registro = {
      id: '1',
      puesto,
      horaSalida: null as Date | null,
    };
    const puestoRepository = { save: jest.fn().mockResolvedValue(puesto) };
    const registroRepository = {
      merge: jest.fn((target, fields) => Object.assign(target, fields)),
      save: jest.fn().mockResolvedValue(registro),
    };
    dataSource.transaction.mockImplementation(async (callback) =>
      callback({
        findOne: jest.fn().mockResolvedValue(registro),
        getRepository: (entity: typeof Puesto | typeof Registro) =>
          entity === Puesto ? puestoRepository : registroRepository,
      }),
    );

    await service.update('1', { horaSalida: '2026-10-24T12:00:00.000Z' });

    expect(registro.horaSalida).toEqual(new Date('2026-10-24T12:00:00.000Z'));
    expect(puesto.estado).toBe(EstadoPuesto.LIBRE);
    expect(puestoRepository.save).toHaveBeenCalledWith(puesto);
  });
});
