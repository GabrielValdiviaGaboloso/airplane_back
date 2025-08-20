import {
  Controller,
  Get,
  Param,
  ParseIntPipe
} from '@nestjs/common';
import { AirlinesService } from './airlines.service';
import { Flight } from './entities/flight.entity';
import { Passenger } from './entities/passenger.entity';
import { Seat } from './entities/seat.entity';
import { Airplane } from './entities/airplane.entity';
import { Purchase } from './entities/purchase.entity';
import { BoardingPass } from './entities/boarding_pass.entity';
import { SeatType } from './entities/seat_type.entity';

@Controller()
export class AirlinesController {
  constructor(private readonly airlinesService: AirlinesService) {}

  // Flights
  @Get('flight')
  async findAllFlights(): Promise<Flight[]> {
    return this.airlinesService.findAllFlights();
  }

  @Get('flight/:id')
  async findOneFlight(@Param('id', ParseIntPipe) id: number): Promise<Flight> {
    return this.airlinesService.findOneFlight(id);
  }

  @Get('flight/:id/passengers')
  async getPassengers(@Param('id', ParseIntPipe) id: number): Promise<Passenger[]> {
    return this.airlinesService.getPassengersByFlight(id);
  }

  // Passengers
  @Get('passenger')
  async findAllPassengers(): Promise<Passenger[]> {
    return this.airlinesService.findAllPassengers();
  }

  @Get('passenger/:id')
  async findOnePassenger(@Param('id', ParseIntPipe) id: number): Promise<Passenger> {
    return this.airlinesService.findOnePassenger(id);
  }

  // Boarding Passes
  @Get('boarding-pass')
  async findAllBoardingPasses(): Promise<BoardingPass[]> {
    return this.airlinesService.findAllBoardingPasses();
  }

  @Get('boarding-pass/:id')
  async findOneBoardingPass(@Param('id', ParseIntPipe) id: number): Promise<BoardingPass> {
    return this.airlinesService.findOneBoardingPass(id);
  }

  // Seats
  @Get('seat')
  async findAllSeats(): Promise<Seat[]> {
    return this.airlinesService.findAllSeats();
  }

  @Get('seat/:id')
  async findOneSeat(@Param('id', ParseIntPipe) id: number): Promise<Seat> {
    return this.airlinesService.findOneSeat(id);
  }

  // Seat Types
  @Get('seat-type')
  async findAllSeatTypes(): Promise<SeatType[]> {
    return this.airlinesService.findAllSeatTypes();
  }

  @Get('seat-type/:id')
  async findOneSeatType(@Param('id', ParseIntPipe) id: number): Promise<SeatType> {
    return this.airlinesService.findOneSeatType(id);
  }

  // Airplanes
  @Get('airplane')
  async findAllAirplanes(): Promise<Airplane[]> {
    return this.airlinesService.findAllAirplanes();
  }

  @Get('airplane/:id')
  async findOneAirplane(@Param('id', ParseIntPipe) id: number): Promise<Airplane> {
    return this.airlinesService.findOneAirplane(id);
  }

  // Purchases
  @Get('purchase')
  async findAllPurchases(): Promise<Purchase[]> {
    return this.airlinesService.findAllPurchases();
  }

  @Get('purchase/:id')
  async findOnePurchase(@Param('id', ParseIntPipe) id: number): Promise<Purchase> {
    return this.airlinesService.findOnePurchase(id);
  }
}
