import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'passenger' })
export class Passenger {
  @PrimaryGeneratedColumn({ name: 'passenger_id' })
  passengerId: number;

  @Column({ name: 'dni' })
  dni: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'age' })
  age: number;

  @Column({ name: 'country' })
  country: string;
}