import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TarifasService } from './tarifas.service';
import { Tarifa } from './entities/tarifa.entity';

describe('TarifasService', () => {
  let service: TarifasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TarifasService,
        { provide: getRepositoryToken(Tarifa), useValue: {} },
      ],
    }).compile();

    service = module.get<TarifasService>(TarifasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
