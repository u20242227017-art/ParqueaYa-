import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { Administrador } from './entities/auth.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Administrador)
    private readonly adminRepository: Repository<Administrador>,

    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { usuario, password } = loginDto;
    const admin = await this.adminRepository.findOne({
      where: { usuario },
    });

    if (!admin || !admin.activo) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const passwordValida = await bcrypt.compare(
      password,
      admin.passwordHash,
    );

    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload = {
      sub: admin.id,
      usuario: admin.usuario,
    };

    const access_token = await this.jwtService.signAsync(payload);
    return {
      access_token,
      token_type: 'Bearer',
      administrador: {
        id: admin.id,
        usuario: admin.usuario,
      },
    };
  }
}
