import { Module } from '@nestjs/common';
import { AirlinesService } from './airlines.service';
import { AirlinesController } from './airlines.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flight } from './entities/flight.entity';
import { Passenger } from './entities/passenger.entity';
import { Seat } from './entities/seat.entity';
import { Airplane } from './entities/airplane.entity';
import { Purchase } from './entities/purchase.entity';
import { BoardingPass, SeatType } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Flight,
      Passenger,
      BoardingPass,
      Seat,
      SeatType,
      Airplane,
      Purchase,
    ]),
  ],
  controllers: [AirlinesController],
  providers: [AirlinesService],
})
export class AirlinesModule {}
