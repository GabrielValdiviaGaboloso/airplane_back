import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import {
  Flight,
  Passenger,
  BoardingPass,
  Seat,
  SeatType,
  Airplane,
  Purchase
} from './entities/index'

export interface CheckInSimulationResult {
  flight: Flight;
  airplane: Airplane;
  assignedBoardingPasses: BoardingPass[]; // Boarding passes filtrados según el parámetro
  assignmentSummary: {
    totalPassengers: number;
    assignedSeats: number;
    unassignedSeats: number;
    groupsProcessed: number;
    minorsWithAdults: number;
    firstClassProcessed: number;
    businessClassProcessed: number;
    economyClassProcessed: number;
  };
}

// NUEVO: Enum para tipos de filtro de clase
export enum SeatClassFilter {
  ALL = 'ALL',
  FIRST_CLASS = 'FIRST_CLASS', 
  BUSINESS_CLASS = 'BUSINESS_CLASS',
  ECONOMY_PREMIUM = 'ECONOMY_PREMIUM',
  ECONOMY = 'ECONOMY'
}

interface SeatAssignmentGroup {
  purchase: Purchase;
  boardingPasses: BoardingPass[];
  passengers: Passenger[];
  seatType: string;
  hasMinors: boolean;
  hasAdults: boolean;
  priority: number;
}

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

  // =========================================================================
  // SIMULACIÓN CHECK-IN CON FILTRO CONFIGURABLE POR CLASE
  // =========================================================================

  async simulateCheckIn(flightId: number, classFilter: SeatClassFilter = SeatClassFilter.ALL): Promise<CheckInSimulationResult> {
    // 1. Validar que el vuelo existe
    const flight = await this.flightRepo.findOne({
      where: { flightId }
    });

    if (!flight) {
      throw new NotFoundException(`Vuelo ${flightId} no encontrado`);
    }

    // 2. Obtener boarding passes del vuelo (sin asientos asignados)
    const boardingPasses = await this.boardingPassRepo.find({
      where: { 
        flight: { flightId },
        seat: IsNull()
      },
      relations: [
        'passenger', 
        'purchase', 
        'seatType', 
        'flight',
        'seat'
      ]
    });

    if (boardingPasses.length === 0) {
      throw new NotFoundException(`No hay boarding passes sin asignar para el vuelo ${flightId}`);
    }

    // 3. Determinar el avión del vuelo
    const airplane = await this.determineAirplaneForFlight(flightId);

    // 4. Obtener asientos disponibles del avión
    const availableSeats = await this.seatRepo.find({
      where: { 
        airplane: { airplane_id: airplane.airplane_id }
      },
      relations: ['seatType', 'airplane']
    });

    // Filtrar asientos que no están ocupados
    const occupiedSeatIds = await this.getOccupiedSeatIds();
    const freeSeats = availableSeats.filter(seat => !occupiedSeatIds.has(seat.seat_id));

    // 5. Agrupar boarding passes por compra CON PRIORIDAD
    const assignmentGroups = this.groupBoardingPassesByPurchaseWithPriority(boardingPasses);

    // 6. Procesar asignación de asientos CON SISTEMA DE PRIORIDAD
    const processedBoardingPasses = await this.processGroupAssignmentsWithPriority(
      assignmentGroups, 
      freeSeats, 
      airplane
    );

    // 7. NUEVO: Obtener boarding passes ya asignados según el filtro
    const alreadyAssignedFiltered = await this.getAlreadyAssignedBoardingPassesByClass(flightId, classFilter);
    

    // 8. NUEVO: Filtrar boarding passes recién asignados según el filtro
    const newlyAssignedFiltered = this.filterBoardingPassesByClass(processedBoardingPasses, classFilter);
    

    // Combinar boarding passes ya asignados con los recién asignados (según filtro)
    const allFilteredBoardingPasses = [
      ...alreadyAssignedFiltered,
      ...newlyAssignedFiltered
    ];
    

    // 9. Generar resumen mejorado
    const assignmentSummary = this.generateEnhancedAssignmentSummary(
      assignmentGroups, 
      processedBoardingPasses
    );

    return {
      flight,
      airplane,
      assignedBoardingPasses: allFilteredBoardingPasses, // Filtrados según parámetro
      assignmentSummary
    };
  }

  // NUEVO: Método para obtener boarding passes ya asignados según clase
  private async getAlreadyAssignedBoardingPassesByClass(flightId: number, classFilter: SeatClassFilter): Promise<BoardingPass[]> {
    // Obtener todos los boarding passes del vuelo que YA TIENEN asiento asignado
    const assignedBoardingPasses = await this.boardingPassRepo.find({
      where: { 
        flight: { flightId }
      },
      relations: [
        'passenger', 
        'purchase', 
        'seatType', 
        'flight',
        'seat'
      ]
    });

    // Filtrar solo los que tienen asiento asignado Y coinciden con el filtro de clase
    const withSeats = assignedBoardingPasses.filter(bp => 
      bp.seat && bp.seat.seat_id
    );

    return this.filterBoardingPassesByClass(withSeats, classFilter);
  }

  // NUEVO: Método para filtrar boarding passes por clase
  private filterBoardingPassesByClass(boardingPasses: BoardingPass[], classFilter: SeatClassFilter): BoardingPass[] {
    if (classFilter === SeatClassFilter.ALL) {
      return boardingPasses;
    }

    return boardingPasses.filter(bp => {
      const seatClass = this.getSeatClass(bp.seatType.name);
      return seatClass === classFilter;
    });
  }

  // NUEVO: Método mejorado para clasificar tipos de asiento
  private getSeatClass(seatType: string): SeatClassFilter {
    const normalized = seatType.toLowerCase().trim();
    
   
    
    // Primera clase / Business
    if (normalized.includes('primera') || 
        normalized.includes('first') || 
        normalized.includes('ejecutiva') ||
        normalized.includes('clase ejecutiva') ||
        (normalized.includes('business') && !normalized.includes('premium'))) {
      
      return SeatClassFilter.FIRST_CLASS;
    }
    
    // Economy Premium
    if (normalized.includes('premium') || 
        normalized.includes('plus') ||
        normalized.includes('comfort')) {
      return SeatClassFilter.ECONOMY_PREMIUM;
    }
    
    // Economy regular
    if (normalized.includes('economy') || 
        normalized.includes('economica') ||
        normalized.includes('turista') ||
        normalized.includes('coach')) {
      return SeatClassFilter.ECONOMY;
    }
    
    // Default a economy si no se puede clasificar
    return SeatClassFilter.ECONOMY;
  }

  // MANTENIDO: Método legacy para compatibilidad
  private isFirstClass(seatType: string): boolean {
    return this.getSeatClass(seatType) === SeatClassFilter.FIRST_CLASS;
  }

  private async getOccupiedSeatIds(): Promise<Set<number>> {
    const occupiedBoardingPasses = await this.boardingPassRepo.find({
      relations: ['seat']
    });

    return new Set(
      occupiedBoardingPasses
        .filter(bp => bp.seat && bp.seat.seat_id)
        .map(bp => bp.seat.seat_id)
    );
  }

  private async determineAirplaneForFlight(flightId: number): Promise<Airplane> {
    const airplanes = await this.airplaneRepo.find();
    
    let airplane: Airplane | undefined;
    
    if (flightId === 1 || flightId === 3) {
      airplane = airplanes.find(a => a.name.includes('AirNova-660'));
    } else if (flightId === 2 || flightId === 4) {
      airplane = airplanes.find(a => a.name.includes('AirMax-720neo'));
    }
    
    if (!airplane && airplanes.length > 0) {
      const airplaneIndex = (flightId - 1) % airplanes.length;
      airplane = airplanes[airplaneIndex];
    }

    if (!airplane) {
      throw new NotFoundException(`No se pudo determinar avión para vuelo ${flightId}`);
    }

    return airplane;
  }

  private groupBoardingPassesByPurchaseWithPriority(boardingPasses: BoardingPass[]): SeatAssignmentGroup[] {
    const groupsMap = new Map<number, SeatAssignmentGroup>();

    boardingPasses.forEach(bp => {
      const purchaseId = bp.purchase.purchase_id;
      
      if (!groupsMap.has(purchaseId)) {
        const seatTypeNormalized = this.normalizeSeatType(bp.seatType.name);
        const priority = this.calculatePriority(seatTypeNormalized, bp.passenger);
        
        groupsMap.set(purchaseId, {
          purchase: bp.purchase,
          boardingPasses: [],
          passengers: [],
          seatType: bp.seatType.name,
          hasMinors: false,
          hasAdults: false,
          priority: priority
        });
      }

      const group = groupsMap.get(purchaseId)!;
      group.boardingPasses.push(bp);
      group.passengers.push(bp.passenger);
      
      if (this.isMinor(bp.passenger)) {
        group.hasMinors = true;
      } else {
        group.hasAdults = true;
      }

      if (group.hasMinors && group.hasAdults) {
        group.priority += 1000;
      }
    });

    return Array.from(groupsMap.values());
  }

  private calculatePriority(seatType: string, passenger: Passenger): number {
    let priority = 0;
    
    switch (seatType) {
      case 'business':
        priority = 3000;
        break;
      case 'economypremium':
        priority = 2000;
        break;
      case 'economy':
      default:
        priority = 1000;
        break;
    }
    
    if (passenger.age && passenger.age >= 65) {
      priority += 100;
    }
    
    if (this.isMinor(passenger)) {
      priority += 50;
    }
    
    return priority;
  }

  private async processGroupAssignmentsWithPriority(
    groups: SeatAssignmentGroup[], 
    availableSeats: Seat[], 
    airplane: Airplane
  ): Promise<BoardingPass[]> {
    const processedBoardingPasses: BoardingPass[] = [];
    const occupiedSeatIds = new Set<number>();

    const sortedGroups = groups.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.boardingPasses.length - b.boardingPasses.length;
    });

    for (const group of sortedGroups) {
      if (group.hasMinors && !group.hasAdults) {
        continue;
      }

      const groupAvailableSeats = availableSeats.filter(seat => 
        !occupiedSeatIds.has(seat.seat_id) &&
        this.normalizeSeatType(seat.seatType.name) === this.normalizeSeatType(group.seatType)
      );

      if (groupAvailableSeats.length < group.boardingPasses.length) {
        continue;
      }

      const assignedSeats = this.assignSeatsToGroup(group, groupAvailableSeats, airplane);
      
      assignedSeats.forEach((seat, index) => {
        if (index < group.boardingPasses.length) {
          const bp = group.boardingPasses[index];
          bp.seat = seat;
          occupiedSeatIds.add(seat.seat_id);
          processedBoardingPasses.push(bp);
        }
      });
    }

    return processedBoardingPasses;
  }

  private assignSeatsToGroup(
    group: SeatAssignmentGroup, 
    availableSeats: Seat[], 
    airplane: Airplane
  ): Seat[] {
    const minors = group.passengers.filter(p => this.isMinor(p));
    const adults = group.passengers.filter(p => !this.isMinor(p));
    
    const windowSeats = this.getWindowSeats(availableSeats, airplane, group.seatType);
    const nonWindowSeats = availableSeats.filter(seat => 
      !this.isWindowSeat(seat, airplane, group.seatType)
    );

    const assignedSeats: Seat[] = [];

    minors.forEach((minor, index) => {
      if (index < windowSeats.length) {
        assignedSeats.push(windowSeats[index]);
      } else if (nonWindowSeats.length > 0) {
        const seat = nonWindowSeats.shift();
        if (seat) {
          assignedSeats.push(seat);
        }
      }
    });

    const remainingSeats = [
      ...windowSeats.slice(minors.length),
      ...nonWindowSeats
    ];

    if (assignedSeats.length > 0) {
      remainingSeats.sort((a, b) => {
        const minDistanceA = Math.min(...assignedSeats.map(assigned => this.getSeatDistance(a, assigned)));
        const minDistanceB = Math.min(...assignedSeats.map(assigned => this.getSeatDistance(b, assigned)));
        return minDistanceA - minDistanceB;
      });
    }

    adults.forEach((adult, index) => {
      if (index < remainingSeats.length) {
        assignedSeats.push(remainingSeats[index]);
      }
    });

    return assignedSeats;
  }

  private getWindowSeats(availableSeats: Seat[], airplane: Airplane, seatType: string): Seat[] {
    const windowColumns = this.getWindowColumns(airplane, seatType);
    return availableSeats.filter(seat => 
      windowColumns.includes(seat.seat_column) &&
      this.isSeatValidInConfiguration(seat, airplane)
    );
  }

  private isWindowSeat(seat: Seat, airplane: Airplane, seatType: string): boolean {
    const windowColumns = this.getWindowColumns(airplane, seatType);
    return windowColumns.includes(seat.seat_column);
  }

  private getWindowColumns(airplane: Airplane, seatType: string): string[] {
    if (airplane.name.includes('AirNova-660')) {
      const normalized = seatType.toLowerCase();
      if (normalized.includes('business') || normalized.includes('primera')) {
        return ['A', 'F'];
      } else {
        return ['A', 'G'];
      }
    } 
    else if (airplane.name.includes('AirMax-720neo')) {
      return ['A', 'I'];
    }
    
    return ['A'];
  }

  private isSeatValidInConfiguration(seat: Seat, airplane: Airplane): boolean {
    if (airplane.name.includes('AirNova-660')) {
      if (seat.seat_row >= 1 && seat.seat_row <= 4) {
        return ['A', 'B', 'E', 'F'].includes(seat.seat_column);
      }
      if ((seat.seat_row >= 8 && seat.seat_row <= 15) || (seat.seat_row >= 19 && seat.seat_row <= 34)) {
        return ['A', 'B', 'C', 'E', 'F', 'G'].includes(seat.seat_column);
      }
      return false;
    } 
    else if (airplane.name.includes('AirMax-720neo')) {
      if (seat.seat_row >= 1 && seat.seat_row <= 5) {
        return ['A', 'E', 'I'].includes(seat.seat_column);
      }
      if ((seat.seat_row >= 9 && seat.seat_row <= 14) || (seat.seat_row >= 18 && seat.seat_row <= 31)) {
        return ['A', 'B', 'D', 'E', 'F', 'H', 'I'].includes(seat.seat_column);
      }
      return false;
    }
    
    return true;
  }

  private getSeatDistance(seat1: Seat, seat2: Seat): number {
    const rowDiff = Math.abs(seat1.seat_row - seat2.seat_row);
    const colDiff = Math.abs(seat1.seat_column.charCodeAt(0) - seat2.seat_column.charCodeAt(0));
    return rowDiff + colDiff;
  }

  private isMinor(passenger: Passenger): boolean {
    return passenger.age != null && passenger.age < 18;
  }

  private normalizeSeatType(seatType: string): string {
    const normalized = seatType.toLowerCase().trim();
    
    if (normalized.includes('business') || normalized.includes('primera')) {
      return 'business';
    } else if (normalized.includes('premium')) {
      return 'economypremium';
    } else {
      return 'economy';
    }
  }

  private generateEnhancedAssignmentSummary(groups: SeatAssignmentGroup[], processedBoardingPasses: BoardingPass[]) {
    let minorsWithAdults = 0;
    let firstClassProcessed = 0;
    let businessClassProcessed = 0;
    let economyClassProcessed = 0;
    
    groups.forEach(group => {
      if (group.hasMinors && group.hasAdults) {
        minorsWithAdults += group.passengers.filter(p => this.isMinor(p)).length;
      }
    });

    processedBoardingPasses.forEach(bp => {
      const normalizedSeatType = this.normalizeSeatType(bp.seatType.name);
      switch (normalizedSeatType) {
        case 'business':
          if (bp.seatType.name.toLowerCase().includes('primera')) {
            firstClassProcessed++;
          } else {
            businessClassProcessed++;
          }
          break;
        case 'economypremium':
          businessClassProcessed++;
          break;
        case 'economy':
        default:
          economyClassProcessed++;
          break;
      }
    });

    const summary = {
      totalPassengers: groups.reduce((sum, group) => sum + group.passengers.length, 0),
      assignedSeats: processedBoardingPasses.length,
      unassignedSeats: groups.reduce((sum, group) => sum + group.passengers.length, 0) - processedBoardingPasses.length,
      groupsProcessed: groups.length,
      minorsWithAdults,
      firstClassProcessed,
      businessClassProcessed,
      economyClassProcessed
    };

    return summary;
  }
}