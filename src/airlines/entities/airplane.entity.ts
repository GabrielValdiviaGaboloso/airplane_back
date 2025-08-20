import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Flight } from './flight.entity';
import { Seat } from './seat.entity';

@Entity()
export class Airplane {
  @PrimaryGeneratedColumn()
  airplane_id: number;

  @Column({ length: 255 })
  name: string;

  @OneToMany(() => Seat, seat => seat.airplane)
  seats: Seat[];

  @OneToMany(() => Flight, flight => flight.airplane)
  flights: Flight[];
}