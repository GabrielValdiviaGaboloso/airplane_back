import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Airplane } from './airplane.entity';
import { BoardingPass } from './boarding_pass.entity';



@Entity({ name: 'flight' })
export class Flight {
  @PrimaryGeneratedColumn({ name: 'flight_id' })
  flightId: number;

  @Column({ name: 'takeoff_date_time' })
  takeoffDateTime: number;

  @Column({ name: 'takeoff_airport' })
  takeoffAirport: string;

  @Column({ name: 'landing_date_time' })
  landingDateTime: Date;

  @Column({ name: 'landing_airport' })
  landingAirport: string;

  
 @ManyToOne(() => Airplane, (airplane) => airplane.flights)
  @JoinColumn({ name: 'airplane_id' })  // Aquí pones el nombre exacto de la columna FK en tu tabla flight
  airplane: Airplane;

  @OneToMany(() => BoardingPass, boardingPass => boardingPass.flight)
  boardingPasses: BoardingPass[];


}