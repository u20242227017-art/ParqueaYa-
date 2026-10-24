import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PuestosService } from './puestos.service';
import { Puesto } from './entities/puesto.entity';

describe('PuestosService', () => {
  let service: PuestosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuestosService,
        { provide: getRepositoryToken(Puesto), useValue: {} },
      ],
    }).compile();

    service = module.get<PuestosService>(PuestosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
