import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Puesto } from '../../puestos/entities/puesto.entity';

@Entity('registro_estacionamiento')
export class Registro {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id: string;

  @Column({ length: 10 })
  placa: string;

  @Column({
    name: 'puesto_id',
    type: 'int',
    unsigned: true,
  })
  puestoId: number;

  @ManyToOne(() => Puesto, { nullable: false })
  @JoinColumn({ name: 'puesto_id' })
  puesto: Puesto;

  @Column({
    name: 'hora_entrada',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  horaEntrada: Date;

  @Column({
    name: 'hora_salida',
    type: 'datetime',
    nullable: true,
  })
  horaSalida: Date | null;

  @Column({
    name: 'duracion_minutos',
    type: 'int',
    unsigned: true,
    nullable: true,
    insert: false,
    update: false,
  })
  duracionMinutos: number | null;
}
