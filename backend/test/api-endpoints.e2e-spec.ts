import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { CajaController } from '../src/caja/caja.controller';
import { CajaService } from '../src/caja/caja.service';
import { PagosController } from '../src/pagos/pagos.controller';
import { PagosService } from '../src/pagos/pagos.service';
import { PuestosController } from '../src/puestos/puestos.controller';
import { PuestosService } from '../src/puestos/puestos.service';
import { RegistrosController } from '../src/registros/registros.controller';
import { RegistrosService } from '../src/registros/registros.service';
import { TarifasController } from '../src/tarifas/tarifas.controller';
import { TarifasService } from '../src/tarifas/tarifas.service';

describe('API endpoints', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const serviceProviders = [
      AuthService,
      CajaService,
      PagosService,
      PuestosService,
      RegistrosService,
      TarifasService,
    ].map((service) => ({
      provide: service,
      useValue: Object.fromEntries(
        ['create', 'findAll', 'findOne', 'update', 'remove', 'login', 'quote'].map(
          (method) => [method, jest.fn().mockResolvedValue([])],
        ),
      ),
    }));
    const module = await Test.createTestingModule({
      controllers: [
        AuthController,
        CajaController,
        PagosController,
        PuestosController,
        RegistrosController,
        TarifasController,
      ],
      providers: serviceProviders,
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('routes all documented API methods to their controllers', async () => {
    const checks: Array<{
      method: 'get' | 'post' | 'patch' | 'delete';
      path: string;
      body?: Record<string, string | number>;
    }> = [
      { method: 'post', path: '/auth/login', body: { usuario: 'admin', password: 'secret' } },
      { method: 'get', path: '/puestos' },
      { method: 'post', path: '/puestos', body: { codigo: 'A1', fila: 1, columna: 1 } },
      { method: 'get', path: '/puestos/1' },
      { method: 'patch', path: '/puestos/1', body: { estado: 'ocupado' } },
      { method: 'delete', path: '/puestos/1' },
      { method: 'get', path: '/registros' },
      { method: 'post', path: '/registros', body: { placa: 'ABC123', tipoVehiculo: 'carro', puestoId: 1 } },
      { method: 'get', path: '/registros/1' },
      { method: 'patch', path: '/registros/1', body: { horaSalida: '2026-10-24T12:00:00.000Z', metodo: 'efectivo', administradorId: '1' } },
      { method: 'get', path: '/registros/1/cobro' },
      { method: 'delete', path: '/registros/1' },
      { method: 'get', path: '/pagos' },
      { method: 'post', path: '/pagos', body: { registroId: '1', monto: 1500, metodo: 'efectivo' } },
      { method: 'get', path: '/pagos/1' },
      { method: 'patch', path: '/pagos/1', body: { estado: 'pagado' } },
      { method: 'delete', path: '/pagos/1' },
      { method: 'get', path: '/tarifas' },
      { method: 'post', path: '/tarifas', body: { id: 1, precioHora: 3000, minutosGracia: 0 } },
      { method: 'get', path: '/tarifas/1' },
      { method: 'patch', path: '/tarifas/1', body: { precioHora: 3500 } },
      { method: 'delete', path: '/tarifas/1' },
      { method: 'get', path: '/caja' },
      { method: 'post', path: '/caja', body: { administradorId: '1', montoInicial: 0 } },
      { method: 'get', path: '/caja/1' },
      { method: 'patch', path: '/caja/1', body: { montoFinal: 1000 } },
      { method: 'delete', path: '/caja/1' },
    ];

    for (const check of checks) {
      let test = request(app.getHttpServer())[check.method](check.path);
      if (check.body) {
        test = test.send(check.body);
      }
      await test.expect(check.method === 'post' ? 201 : 200);
    }
  });

  it('rejects invalid request bodies before reaching a controller', async () => {
    await request(app.getHttpServer())
      .post('/puestos')
      .send({ codigo: 'A1', fila: 'not-a-number', columna: 1, extra: true })
      .expect(400);
  });

  it('requires a valid plate format for the selected vehicle type', async () => {
    const invalidRegistrations = [
      { placa: 'ABC12', tipoVehiculo: 'carro', puestoId: 1 },
      { placa: 'AB123C', tipoVehiculo: 'carro', puestoId: 1 },
      { placa: 'ABC123', tipoVehiculo: 'moto', puestoId: 1 },
      { placa: 'ABC12D', tipoVehiculo: 'bicicleta', puestoId: 1 },
      { placa: 'ABC12D', puestoId: 1 },
    ];

    for (const registration of invalidRegistrations) {
      await request(app.getHttpServer())
        .post('/registros')
        .send(registration)
        .expect(400);
    }
  });

  it.each([
    { placa: 'ABC123', tipoVehiculo: 'carro' },
    { placa: 'ABC12D', tipoVehiculo: 'moto' },
    { placa: 'abc12d', tipoVehiculo: 'moto' },
  ])('accepts a valid $tipoVehiculo plate', async (registration) => {
    await request(app.getHttpServer())
      .post('/registros')
      .send({ ...registration, puestoId: 1 })
      .expect(201);
  });
});
