import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PuestosModule } from './puestos/puestos.module';
import { RegistrosModule } from './registros/registros.module';
import { PagosModule } from './pagos/pagos.module';
import { TarifasModule } from './tarifas/tarifas.module';
import { CajaModule } from './caja/caja.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'backend/.env'],
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const port = Number(config.getOrThrow<string>('DB_PORT'));
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          throw new Error('DB_PORT must be a valid TCP port.');
        }

        return {
          type: 'mysql' as const,
          host: config.getOrThrow<string>('DB_HOST'),
          port,
          username: config.getOrThrow<string>('DB_USERNAME'),
          password: config.get<string>('DB_PASSWORD') ?? '',
          database: config.getOrThrow<string>('DB_DATABASE'),
          autoLoadEntities: true,
          synchronize: false,
        };
      },
    }),

    AuthModule,
    PuestosModule,
    RegistrosModule,
    PagosModule,
    TarifasModule,
    CajaModule,
  ],
})
export class AppModule {}
