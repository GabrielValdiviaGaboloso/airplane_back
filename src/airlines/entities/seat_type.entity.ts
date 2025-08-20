import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class SeatType {
  @PrimaryGeneratedColumn()
  seat_type_id: number;

  @Column()
  name: string;
}