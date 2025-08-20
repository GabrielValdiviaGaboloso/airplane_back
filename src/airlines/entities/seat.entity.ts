import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

import { Airplane } from './airplane.entity';
import { SeatType } from './seat_type.entity';

@Entity()
export class Seat {
  @PrimaryGeneratedColumn()
  seat_id: number;

  @Column({ length: 2 })
  seat_column: string;

  @Column()
  seat_row: number;

  @ManyToOne(() => SeatType, seatType => seatType.seats)
  seat_type: SeatType;

  @ManyToOne(() => Airplane, airplane => airplane.seats)
  airplane: Airplane;
}
