import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Administrador } from '../../auth/entities/auth.entity';

@Entity('turno_caja')
export class TurnoCaja {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id: string;

  @Column({
    name: 'administrador_id',
    type: 'bigint',
    unsigned: true,
  })
  administradorId: string;

  @ManyToOne(() => Administrador, { nullable: false })
  @JoinColumn({ name: 'administrador_id' })
  administrador: Administrador;

  @Column({
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  apertura: Date;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  cierre: Date | null;

  @Column({
    name: 'monto_inicial',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  montoInicial: string;

  @Column({
    name: 'monto_final',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  montoFinal: string | null;
}
