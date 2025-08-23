import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Flight,
  Passenger,
  BoardingPass,
  Seat,
  SeatType,
  Airplane,
  Purchase
} from './entities/index'

@Injectable()
export class AirlinesService {
  constructor(
    @InjectRepository(Flight)
    private readonly flightRepo: Repository<Flight>,

    @InjectRepository(Passenger)
    private readonly passengerRepo: Repository<Passenger>,

    @InjectRepository(BoardingPass)
    private readonly boardingPassRepo: Repository<BoardingPass>,

    @InjectRepository(Seat)
    private readonly seatRepo: Repository<Seat>,

    @InjectRepository(SeatType)
    private readonly seatTypeRepo: Repository<SeatType>,

    @InjectRepository(Airplane)
    private readonly airplaneRepo: Repository<Airplane>,

    @InjectRepository(Purchase)
    private readonly purchaseRepo: Repository<Purchase>,
  ) {}

  // Flights
  async findAllFlights(): Promise<Flight[]> {
    return this.flightRepo.find();
  }

  async findOneFlight(id: number): Promise<Flight> {
    const flight = await this.flightRepo.findOneBy({ flightId: id });
    if (!flight) throw new NotFoundException(`Flight ${id} not found`);
    return flight;
  }

  async getPassengersByFlight(flightId: number): Promise<Passenger[]> {
    const boardingPasses = await this.boardingPassRepo.find({
      where: { flight: { flightId: flightId } },
      relations: ['passenger', 'flight']
    });
    return boardingPasses.map(bp => bp.passenger);
  }

  // Passengers
  async findAllPassengers(): Promise<Passenger[]> {
    return this.passengerRepo.find();
  }

  async findOnePassenger(id: number): Promise<Passenger> {
    const passenger = await this.passengerRepo.findOneBy({ passenger_Id: id });
    if (!passenger) throw new NotFoundException(`Passenger ${id} not found`);
    return passenger;
  }

  // Boarding Passes
  async findAllBoardingPasses(): Promise<BoardingPass[]> {
    return this.boardingPassRepo.find({ relations: ['passenger', 'flight','seat','seatType','purchase'] });
  }

  async findOneBoardingPass(id: number): Promise<BoardingPass> {
    const bp = await this.boardingPassRepo.findOne({
      where: { boarding_pass_id: id },
      relations: ['passenger', 'flight','seat','seatType','purchase'],
    });
    if (!bp) throw new NotFoundException(`Boarding pass ${id} not found`);
    return bp;
  }

  // Seats
  async findAllSeats(): Promise<Seat[]> {
    return this.seatRepo.find({ relations: ['seatType', 'airplane'] });
  }

  async findOneSeat(id: number): Promise<Seat> {
    const seat = await this.seatRepo.findOne({
      where: { seat_id: id },
      relations: ['seatType', 'airplane'],
    });
    if (!seat) throw new NotFoundException(`Seat ${id} not found`);
    return seat;
  }

  // Seat Types
  async findAllSeatTypes(): Promise<SeatType[]> {
    return this.seatTypeRepo.find();
  }

  async findOneSeatType(id: number): Promise<SeatType> {
    const type = await this.seatTypeRepo.findOneBy({ seat_type_id: id });
    if (!type) throw new NotFoundException(`Seat type ${id} not found`);
    return type;
  }

  // Airplanes
  async findAllAirplanes(): Promise<Airplane[]> {
    return this.airplaneRepo.find();
  }

  async findOneAirplane(id: number): Promise<Airplane> {
    const airplane = await this.airplaneRepo.findOneBy({ airplane_id: id });
    if (!airplane) throw new NotFoundException(`Airplane ${id} not found`);
    return airplane;
  }

  // Purchases
  async findAllPurchases(): Promise<Purchase[]> {
    return this.purchaseRepo.find();
  }

  async findOnePurchase(id: number): Promise<Purchase> {
    const purchase = await this.purchaseRepo.findOneBy({ purchase_id: id });
    if (!purchase) throw new NotFoundException(`Purchase ${id} not found`);
    return purchase;
  }
}
