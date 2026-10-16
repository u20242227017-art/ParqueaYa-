import { Body, Controller, Get, Post } from '@nestjs/common';

@Controller()
export class AppController {

  @Get('parqueaya')
  inicio(): string {
    return 'Bienvenido a ParqueaYa';
  }

  @Post('login')
  login(@Body() datos: { usuario: string; contraseña: string }) {
    return {
      mensaje: 'Datos recibidos correctamente',
      correo: datos.usuario
    };
  }
}