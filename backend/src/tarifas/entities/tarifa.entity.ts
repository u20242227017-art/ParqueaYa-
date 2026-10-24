import {
  Entity,
  PrimaryColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tarifa')
export class Tarifa {
  @PrimaryColumn({
    type: 'tinyint',
    unsigned: true,
  })
  id: number;

  @Column({
    name: 'precio_hora',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  precioHora: string;

  @Column({
    name: 'minutos_gracia',
    type: 'smallint',
    unsigned: true,
    default: 0,
  })
  minutosGracia: number;

  @UpdateDateColumn({
    name: 'actualizado_en',
    type: 'datetime',
  })
  actualizadoEn: Date;
}
