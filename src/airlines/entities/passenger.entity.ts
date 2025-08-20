import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BoardingPass } from './boarding_pass.entity';

@Entity({ name: 'passenger' })
export class Passenger {
  @PrimaryGeneratedColumn({ name: 'passenger_id' })
  passenger_Id: number;

  @Column({ name: 'dni' })
  dni: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'age' })
  age: number;

  @Column({ name: 'country' })
  country: string;
  @OneToMany(() => BoardingPass, boardingPass => boardingPass.flight)
  boardingPasses: BoardingPass[];

}