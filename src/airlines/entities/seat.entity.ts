import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Airplane } from './airplane.entity';
import { SeatType } from './seat_type.entity';

@Entity()
export class Seat {
  @PrimaryGeneratedColumn({ name: 'seat_id' })
  seat_id: number;

  @Column()
  seat_column: string;

  @Column()
  seat_row: number;

  @ManyToOne(() => SeatType)
  @JoinColumn({ name: 'seat_type_id' })
  seatType: SeatType;


  @ManyToOne(() => Airplane)
  @JoinColumn({ name: 'airplane_id' })
  airplane: Airplane;
   
}
