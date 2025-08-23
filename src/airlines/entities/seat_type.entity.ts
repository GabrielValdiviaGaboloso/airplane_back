import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BoardingPass } from './boarding_pass.entity';

@Entity()
export class SeatType {
  @PrimaryGeneratedColumn()
  seat_type_id: number;

  @Column()
  name: string;

   @OneToMany(() => BoardingPass, boardingPass => boardingPass.seatType)
   boardingPasses: BoardingPass[];
}