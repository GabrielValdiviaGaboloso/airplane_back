import { Module } from '@nestjs/common';
import { AirlinesService } from './airlines.service';
import { AirlinesController } from './airlines.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flight } from './entities/flight.entity';
import { Passenger } from './entities/passenger.entity';

@Module({
   imports: [
    TypeOrmModule.forFeature([Flight,Passenger]) 
  ],
  controllers: [AirlinesController],
  providers: [AirlinesService],
})
export class AirlinesModule {}
