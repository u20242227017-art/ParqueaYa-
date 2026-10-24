import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CajaService } from './caja.service';
import { TurnoCaja } from './entities/caja.entity';

describe('CajaService', () => {
  let service: CajaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CajaService,
        { provide: getRepositoryToken(TurnoCaja), useValue: {} },
      ],
    }).compile();

    service = module.get<CajaService>(CajaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
