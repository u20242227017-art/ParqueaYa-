import { Test, TestingModule } from '@nestjs/testing';
import { TarifasController } from './tarifas.controller';
import { TarifasService } from './tarifas.service';

describe('TarifasController', () => {
  let controller: TarifasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TarifasController],
      providers: [
        {
          provide: TarifasService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<TarifasController>(TarifasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
