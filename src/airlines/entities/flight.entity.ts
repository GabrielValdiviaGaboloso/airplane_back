import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
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

  @Column({ name: 'airplane_id' })
  airplaneId: number;

 @ManyToOne(() => Airplane, airplane => airplane.flights)
  airplane: Airplane;

  @OneToMany(() => BoardingPass, boardingPass => boardingPass.flight)
  boardingPasses: BoardingPass[];


}