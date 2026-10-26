import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { Administrador } from './entities/auth.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let adminRepository: { findOne: jest.Mock };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    adminRepository = { findOne: jest.fn() };
    jwtService = { signAsync: jest.fn().mockResolvedValue('access-token') };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Administrador), useValue: adminRepository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('authenticates any active administrator using its username and password', async () => {
    const password = 'correct-password';
    const admin = {
      id: '7',
      usuario: 'otro-admin',
      passwordHash: await bcrypt.hash(password, 4),
      activo: true,
    };
    adminRepository.findOne.mockResolvedValue(admin);

    await expect(
      service.login({ usuario: admin.usuario, password }),
    ).resolves.toEqual({
      access_token: 'access-token',
      token_type: 'Bearer',
      administrador: { id: admin.id, usuario: admin.usuario },
    });
    expect(adminRepository.findOne).toHaveBeenCalledWith({
      where: { usuario: admin.usuario },
    });
  });

  it('rejects inactive administrators and incorrect passwords', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    adminRepository.findOne
      .mockResolvedValueOnce({
        id: '7',
        usuario: 'inactive-admin',
        passwordHash,
        activo: false,
      })
      .mockResolvedValueOnce({
        id: '8',
        usuario: 'active-admin',
        passwordHash,
        activo: true,
      });

    await expect(
      service.login({ usuario: 'inactive-admin', password: 'correct-password' }),
    ).rejects.toThrow('Credenciales incorrectas');
    await expect(
      service.login({ usuario: 'active-admin', password: 'incorrect-password' }),
    ).rejects.toThrow('Credenciales incorrectas');
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });
});
