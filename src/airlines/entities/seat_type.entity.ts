import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BoardingPass } from './boarding_pass.entity';
import { Seat } from './seat.entity';

@Entity('seat_type')
export class SeatType {
  @PrimaryGeneratedColumn()
  seat_type_id: number;

  @Column({ length: 255 })
  name: string;

  @OneToMany(() => BoardingPass, boardingPass => boardingPass.seat_type)
  boardingPasses: BoardingPass[];

  @OneToMany(() => Seat, seat => seat.seat_type)
  seats: Seat[];
}