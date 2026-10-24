import { Test, TestingModule } from '@nestjs/testing';
import { PuestosController } from './puestos.controller';
import { PuestosService } from './puestos.service';

describe('PuestosController', () => {
  let controller: PuestosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PuestosController],
      providers: [
        {
          provide: PuestosService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<PuestosController>(PuestosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
