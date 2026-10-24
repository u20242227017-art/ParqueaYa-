import { Test, TestingModule } from '@nestjs/testing';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';

describe('PagosController', () => {
  let controller: PagosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PagosController],
      providers: [
        {
          provide: PagosService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<PagosController>(PagosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
