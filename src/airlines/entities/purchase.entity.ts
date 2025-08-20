import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BoardingPass } from './boarding_pass.entity';

@Entity()
export class Purchase {
  @PrimaryGeneratedColumn()
  purchase_id: number;

  @Column()
  purchase_date: number;

  @OneToMany(() => BoardingPass, boardingPass => boardingPass.Purchase)
  boardingPasses: BoardingPass[];
}