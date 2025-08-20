import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Purchase } from './purchase.entity';
import { Passenger } from './passenger.entity';
import { SeatType } from './seat_type.entity';
import { Seat } from './seat.entity';
import { Flight } from './flight.entity';

@Entity()
export class BoardingPass {
  @PrimaryGeneratedColumn()
  boarding_pass_id: number;

  @ManyToOne(() => Purchase, purchase => purchase.boardingPasses)
  purchase: Purchase;

  @ManyToOne(() => SeatType, seatType => seatType.boardingPasses)
  seat_type: SeatType;

  @ManyToOne(() => Seat, seat => seat)
  seat: Seat;

  @ManyToOne(() => Flight, flight => flight.boardingPasses)
  flight: Flight;
}