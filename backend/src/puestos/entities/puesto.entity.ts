import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

export enum EstadoPuesto {
  LIBRE = 'libre',
  OCUPADO = 'ocupado',
  FUERA_SERVICIO = 'fuera_servicio',
}

@Entity('puesto')
export class Puesto {
  @PrimaryGeneratedColumn({
    type: 'int',
    unsigned: true,
  })
  id: number;

  @Column({ length: 12, unique: true })
  codigo: string;

  @Column({
    type: 'smallint',
    unsigned: true,
    default: 1,
  })
  piso: number;

  @Column({ type: 'smallint', unsigned: true })
  fila: number;

  @Column({ type: 'smallint', unsigned: true })
  columna: number;

  @Column({
    type: 'enum',
    enum: EstadoPuesto,
    default: EstadoPuesto.LIBRE,
  })
  estado: EstadoPuesto;
}
