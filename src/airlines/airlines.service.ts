import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Flight } from './entities/flight.entity';
import { Passenger } from './entities/passenger.entity';

@Injectable()
export class AirlinesService {
   constructor(
   @InjectRepository(Flight)
    private readonly flightRepo: Repository<Flight>,

    @InjectRepository(Passenger)
    private readonly passengerRepo: Repository<Passenger>,
  ) {}

  async findAll(): Promise<Flight[]> {
    return  this.flightRepo.find();
  }

 async findOne(id: number): Promise<Flight> {
  const flight = await this.flightRepo.findOneBy({ flightId: id });
  if (!flight) {
    throw new NotFoundException(`Flight with id ${id} not found`);
  }
  return flight;
}

 async getPassengersByFlight(passengerId: number): Promise<any[]> {
  
  const passengers = await this.passengerRepo.find({
    where: { passengerId : passengerId},
  });

  // Transformamos la respuesta a camelCase
  return passengers.map(p => ({
    passengerId: p.passengerId,
    name: p.name,
    age: p.age,
    country: p.country
  }));
}

}
