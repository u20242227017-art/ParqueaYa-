import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Registro } from '../../registros/entities/registro.entity';
import { TurnoCaja } from '../../caja/entities/caja.entity';

export enum MetodoPago {
  EFECTIVO = 'efectivo',
  TARJETA = 'tarjeta',
  TRANSFERENCIA = 'transferencia',
  OTRO = 'otro',
}

export enum EstadoPago {
  PENDIENTE = 'pendiente',
  PAGADO = 'pagado',
  ANULADO = 'anulado',
}

@Entity('pago')
export class Pago {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id: string;

  @Column({
    name: 'registro_id',
    type: 'bigint',
    unsigned: true,
    unique: true,
  })
  registroId: string;

  @ManyToOne(() => Registro, { nullable: false })
  @JoinColumn({ name: 'registro_id' })
  registro: Registro;

  @Column({
    name: 'turno_caja_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  turnoCajaId: string | null;

  @ManyToOne(() => TurnoCaja, { nullable: true })
  @JoinColumn({ name: 'turno_caja_id' })
  turnoCaja: TurnoCaja | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  monto: string;

  @Column({
    type: 'enum',
    enum: MetodoPago,
  })
  metodo: MetodoPago;

  @Column({
    type: 'enum',
    enum: EstadoPago,
    default: EstadoPago.PAGADO,
  })
  estado: EstadoPago;

  @Column({
    name: 'fecha_pago',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaPago: Date;
}
