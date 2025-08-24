import { Controller, Get, Param, NotFoundException, ParseIntPipe } from '@nestjs/common';
import { AirlinesService, CheckInSimulationResult } from './airlines.service';

@Controller()
export class AirlinesController {
  constructor(private readonly airlinesService: AirlinesService) {}

  // =========================================================================
  // ENDPOINTS EXISTENTES
  // =========================================================================

  @Get('flight')
  async getAllFlights() {
    return await this.airlinesService.findAllFlights();
  }

  @Get('flight/:id')
  async getOneFlight(@Param('id', ParseIntPipe) id: number) {
    return await this.airlinesService.findOneFlight(id);
  }

  @Get('flight/:id/passengers')
  async getPassengersByFlight(@Param('id', ParseIntPipe) flightId: number) {
    return await this.airlinesService.getPassengersByFlight(flightId);
  }

  @Get('passenger')
  async getAllPassengers() {
    return await this.airlinesService.findAllPassengers();
  }

  @Get('passenger/:id')
  async getOnePassenger(@Param('id', ParseIntPipe) id: number) {
    return await this.airlinesService.findOnePassenger(id);
  }

  @Get('boarding-pass')
  async getAllBoardingPasses() {
    return await this.airlinesService.findAllBoardingPasses();
  }

  @Get('boarding-pass/:id')
  async getOneBoardingPass(@Param('id', ParseIntPipe) id: number) {
    return await this.airlinesService.findOneBoardingPass(id);
  }

  @Get('seat')
  async getAllSeats() {
    return await this.airlinesService.findAllSeats();
  }

  @Get('seat/:id')
  async getOneSeat(@Param('id', ParseIntPipe) id: number) {
    return await this.airlinesService.findOneSeat(id);
  }

  @Get('seat-type')
  async getAllSeatTypes() {
    return await this.airlinesService.findAllSeatTypes();
  }

  @Get('seat-type/:id')
  async getOneSeatType(@Param('id', ParseIntPipe) id: number) {
    return await this.airlinesService.findOneSeatType(id);
  }

  @Get('airplane')
  async getAllAirplanes() {
    return await this.airlinesService.findAllAirplanes();
  }

  @Get('airplane/:id')
  async getOneAirplane(@Param('id', ParseIntPipe) id: number) {
    return await this.airlinesService.findOneAirplane(id);
  }

  @Get('purchase')
  async getAllPurchases() {
    return await this.airlinesService.findAllPurchases();
  }

  @Get('purchase/:id')
  async getOnePurchase(@Param('id', ParseIntPipe) id: number) {
    return await this.airlinesService.findOnePurchase(id);
  }

  // =========================================================================
  // NUEVO ENDPOINT DE SIMULACIÓN CHECK-IN
  // =========================================================================

  @Get('flight/:id/check-in-automatic')
  async getCheckInSimulation(@Param('id', ParseIntPipe) flightId: number) {
    try {
      const simulation = await this.airlinesService.simulateCheckIn(flightId);
      
      return {
        success: true,
        flightId,
        message: `Simulación de check-in completada para vuelo ${flightId}`,
        data: simulation,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new NotFoundException({
        success: false,
        flightId,
        message: `Error procesando simulación para vuelo ${flightId}`,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}