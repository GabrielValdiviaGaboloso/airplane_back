import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Flight } from './flight.entity';
import { Passenger } from './passenger.entity';
import { Purchase } from './purchase.entity';
import { Seat } from './seat.entity';
import { SeatType } from './seat_type.entity';

@Entity()
export class BoardingPass {
  @PrimaryGeneratedColumn()
  boarding_pass_id: number;



  @ManyToOne(() => Flight, (flight) => flight.boardingPasses)
  @JoinColumn({ name: 'flight_id' })
  flight: Flight;

 

  @ManyToOne(() => Passenger, (passenger) => passenger.boardingPasses)
  @JoinColumn({ name: 'passenger_id' })
  passenger: Passenger;

  

  @ManyToOne(() => Purchase, (purchase) => purchase.boardingPasses)
  @JoinColumn({ name: 'purchase_id' })
  purchase: Purchase;

  @ManyToOne(() => Seat, (Seat) => Seat.boardingPasses)
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;

  @ManyToOne(() => SeatType, (SeatType) => SeatType.boardingPasses)
  @JoinColumn({ name: 'seat_type_id' })
  seatType: SeatType;


}