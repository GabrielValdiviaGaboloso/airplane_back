import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { AirlinesService } from './airlines.service';
import { Flight } from './entities/flight.entity';
import { Passenger } from './entities/passenger.entity';

@Controller('flight')
export class AirlinesController {
  constructor(private readonly airlinesService: AirlinesService) {}

  @Get()
  async  findAll() : Promise<Flight[]> {
    return this.airlinesService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Flight> {
    return this.airlinesService.findOne(id)
  }

   @Get(':id/passengers')
  async getPassengers(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Passenger[]> {
    return this.airlinesService.getPassengersByFlight(id);
  }

}
