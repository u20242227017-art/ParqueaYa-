import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RegistrosService } from './registros.service';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { UpdateRegistroDto } from './dto/update-registro.dto';

@Controller('registros')
export class RegistrosController {
  constructor(private readonly registrosService: RegistrosService) {}

  @Post()
  create(@Body() createRegistroDto: CreateRegistroDto) {
    return this.registrosService.create(createRegistroDto);
  }

  @Get()
  findAll() {
    return this.registrosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registrosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRegistroDto: UpdateRegistroDto) {
    return this.registrosService.update(id, updateRegistroDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.registrosService.remove(id);
  }
}
