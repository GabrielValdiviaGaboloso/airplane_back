import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Flight } from './flight.entity';
import { Passenger } from './passenger.entity';
import { Purchase } from './purchase.entity';

@Entity()
export class BoardingPass {
  @PrimaryGeneratedColumn()
  boarding_pass_id: number;

  @ManyToOne(() => Flight, (flight) => flight.boardingPasses)
  @JoinColumn({ name: 'flight_id' })
  flight: Flight;

  @Column()
  flight_id: number;  // 👈 Esto soluciona el error de flightId

  @ManyToOne(() => Passenger, (passenger) => passenger.boardingPasses)
  @JoinColumn({ name: 'passenger_id' })
  passenger: Passenger;

  @Column()
  passenger_id: number;

  @ManyToOne(() => Purchase, (Purchase) => Purchase.boardingPasses)
  @JoinColumn({ name: 'purchase_id' })
  Purchase: Purchase;
}