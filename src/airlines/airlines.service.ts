import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
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
  assignedBoardingPasses: BoardingPass[];
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

interface SeatAssignmentGroup {
  purchase: Purchase;
  boardingPasses: BoardingPass[];
  passengers: Passenger[];
  seatType: string;
  hasMinors: boolean;
  hasAdults: boolean;
  priority: number; // Nueva propiedad para prioridad
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
  // SIMULACIÓN CHECK-IN CON PRIORIDAD DE PRIMERA CLASE
  // =========================================================================

  
  async simulateCheckIn(flightId: number): Promise<CheckInSimulationResult> {
    console.log(`=== INICIANDO SIMULACIÓN CHECK-IN PARA VUELO ${flightId} ===`);

    // 1. Validar que el vuelo existe
    const flight = await this.flightRepo.findOne({ where: { flightId } });
    if (!flight) {
        throw new NotFoundException(`Vuelo ${flightId} no encontrado`);
    }

    // 2. Obtener TODOS los boarding passes del vuelo
    const allBoardingPasses = await this.boardingPassRepo.find({
        where: { flight: { flightId } },
        relations: ['passenger', 'purchase', 'seatType', 'flight', 'seat']
    });

    if (allBoardingPasses.length === 0) {
        throw new NotFoundException(`No hay boarding passes para el vuelo ${flightId}`);
    }

    // 3. Separar los boarding passes en dos grupos: asignados y sin asignar
    const assignedBoardingPasses = allBoardingPasses.filter(bp => bp.seat !== null);
    const unassignedBoardingPasses = allBoardingPasses.filter(bp => bp.seat === null);

    console.log(`Boarding passes asignados: ${assignedBoardingPasses.length}`);
    console.log(`Boarding passes sin asignar: ${unassignedBoardingPasses.length}`);

    // 4. Determinar el avión del vuelo
    const airplane = await this.determineAirplaneForFlight(flightId);

    // 5. Obtener asientos disponibles del avión (asumiendo que los que ya están asignados a este vuelo no están disponibles)
    const occupiedSeatIds = new Set(assignedBoardingPasses.map(bp => bp.seat.seat_id));
    const availableSeats = await this.seatRepo.find({
        where: { airplane: { airplane_id: airplane.airplane_id } },
        relations: ['seatType', 'airplane']
    });

    const freeSeats = availableSeats.filter(seat => !occupiedSeatIds.has(seat.seat_id));

    console.log(`Asientos disponibles en ${airplane.name}: ${freeSeats.length}`);
    
    // 6. Procesar la asignación de los boarding passes sin asignar
    const assignmentGroups = this.groupBoardingPassesByPurchaseWithPriority(unassignedBoardingPasses);
    console.log(`Grupos de compra a procesar: ${assignmentGroups.length}`);

    const newlyAssignedBoardingPasses = await this.processGroupAssignmentsWithPriority(
        assignmentGroups,
        freeSeats,
        airplane
    );

    // 7. Combinar los boarding passes que ya estaban asignados con los recién asignados
    const allProcessedBoardingPasses = [...assignedBoardingPasses, ...newlyAssignedBoardingPasses];

    // 8. Guardar las nuevas asignaciones en base de datos
    await this.saveSeatAssignments(newlyAssignedBoardingPasses);

    // 9. Generar resumen mejorado
    const assignmentSummary = this.generateEnhancedAssignmentSummary(
        assignmentGroups,
        newlyAssignedBoardingPasses
    );

    console.log(`=== SIMULACIÓN COMPLETADA ===`);

    return {
        flight,
        airplane,
        assignedBoardingPasses: allProcessedBoardingPasses, // Devolvemos todos los asignados
        assignmentSummary
    };
}

// El método getOccupiedSeatIds() también debe ser ajustado
private async getOccupiedSeatIds(flightId: number): Promise<Set<number>> {
    const occupiedBoardingPasses = await this.boardingPassRepo.find({
        where: { flight: { flightId }, seat: Not(IsNull()) },
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

    console.log(`Avión asignado: ${airplane.name} (ID: ${airplane.airplane_id})`);
    return airplane;
  }

  // NUEVO: Método mejorado que asigna prioridades por clase
  private groupBoardingPassesByPurchaseWithPriority(boardingPasses: BoardingPass[]): SeatAssignmentGroup[] {
    console.log('Agrupando boarding passes por compra con prioridad...', boardingPasses);
    const groupsMap = new Map<number, SeatAssignmentGroup>();

    boardingPasses.forEach(bp => {
      const purchaseId = bp.purchase.purchase_id;
      
      if (!groupsMap.has(purchaseId)) {
        console.log(`Creando nuevo grupo para compra ${purchaseId} - Tipo de asiento: ${bp.seatType.name}`);
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

      // Recalcular prioridad si hay menores (aumenta la prioridad)
      if (group.hasMinors && group.hasAdults) {
        group.priority += 1000; // Boost considerable para familias con menores
      }
    });

    return Array.from(groupsMap.values());
  }

  // NUEVO: Sistema de prioridades
  private calculatePriority(seatType: string, passenger: Passenger): number {
    let priority = 0;
    
    // Prioridad por clase de asiento (mayor número = mayor prioridad)
    switch (seatType) {
      case 'business': // Primera clase y business
        priority = 3000;
        console.log(`🥇 Prioridad PRIMERA CLASE/BUSINESS: ${passenger.name} - Prioridad base: ${priority}`);
        break;
      case 'economypremium': // Economy premium
        priority = 2000;
        console.log(`🥈 Prioridad ECONOMY PREMIUM: ${passenger.name} - Prioridad base: ${priority}`);
        break;
      case 'economy': // Economy regular
      default:
        priority = 1000;
        console.log(`🥉 Prioridad ECONOMY: ${passenger.name} - Prioridad base: ${priority}`);
        break;
    }
    
    // Bonus por edad (adultos mayores tienen prioridad)
    if (passenger.age && passenger.age >= 65) {
      priority += 100;
      console.log(`👴 Bonus adulto mayor para ${passenger.name}: +100`);
    }
    
    // Los menores tendrán prioridad adicional cuando se procesen grupos familiares
    if (this.isMinor(passenger)) {
      priority += 50;
      console.log(`👶 Bonus menor para ${passenger.name}: +50`);
    }
    
    return priority;
  }

  // NUEVO: Procesamiento con sistema de prioridad
  private async processGroupAssignmentsWithPriority(
    groups: SeatAssignmentGroup[], 
    availableSeats: Seat[], 
    airplane: Airplane
  ): Promise<BoardingPass[]> {
    const processedBoardingPasses: BoardingPass[] = [];
    const occupiedSeatIds = new Set<number>();

    // ORDENAMIENTO MEJORADO CON PRIORIDADES:
    // 1. Primera clase/Business con menores y adultos
    // 2. Primera clase/Business sin menores
    // 3. Premium con menores y adultos  
    // 4. Premium sin menores
    // 5. Economy con menores y adultos
    // 6. Economy sin menores
    const sortedGroups = groups.sort((a, b) => {
      // Primero por prioridad total (descendente)
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      
      // En caso de empate, grupos más pequeños primero
      return a.boardingPasses.length - b.boardingPasses.length;
    });

    console.log('\n=== ORDEN DE PROCESAMIENTO DE GRUPOS ===');
    sortedGroups.forEach((group, index) => {
      const seatTypeDisplay = this.normalizeSeatType(group.seatType).toUpperCase();
      const familyStatus = group.hasMinors && group.hasAdults ? ' (FAMILIA)' : '';
      console.log(`${index + 1}. Grupo ${group.purchase.purchase_id}: ${seatTypeDisplay}${familyStatus} - Prioridad: ${group.priority} - ${group.passengers.length} pax`);
    });
    console.log('==========================================\n');

    for (const group of sortedGroups) {
      const seatTypeDisplay = this.normalizeSeatType(group.seatType).toUpperCase();
      console.log(`\n🎯 Procesando grupo ${group.purchase.purchase_id}: ${seatTypeDisplay} (${group.passengers.length} pasajeros) - Prioridad: ${group.priority}`);
      
      // Validación: menores deben tener adultos
      if (group.hasMinors && !group.hasAdults) {
        console.warn(`❌ Grupo ${group.purchase.purchase_id} tiene menores sin adultos - SALTADO`);
        continue;
      }

      const groupAvailableSeats = availableSeats.filter(seat => 
        !occupiedSeatIds.has(seat.seat_id) &&
        this.normalizeSeatType(seat.seatType.name) === this.normalizeSeatType(group.seatType)
      );

      if (groupAvailableSeats.length < group.boardingPasses.length) {
        console.warn(`❌ Insuficientes asientos ${seatTypeDisplay} para grupo ${group.purchase.purchase_id} (necesarios: ${group.boardingPasses.length}, disponibles: ${groupAvailableSeats.length})`);
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

      console.log(`✅ Grupo ${group.purchase.purchase_id} ${seatTypeDisplay} procesado: ${assignedSeats.length} asientos asignados`);
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
    
    // Obtener asientos de ventana para menores (especialmente importante en primera clase)
    const windowSeats = this.getWindowSeats(availableSeats, airplane, group.seatType);
    const nonWindowSeats = availableSeats.filter(seat => 
      !this.isWindowSeat(seat, airplane, group.seatType)
    );

    const assignedSeats: Seat[] = [];

    // PASO 1: Asignar menores a ventanas (prioridad en primera clase)
    minors.forEach((minor, index) => {
      if (index < windowSeats.length) {
        assignedSeats.push(windowSeats[index]);
        const seatTypeDisplay = this.normalizeSeatType(group.seatType).toUpperCase();
        console.log(`👶 Menor ${minor.name} (${seatTypeDisplay}) asignado a ventana ${windowSeats[index].seat_column}${windowSeats[index].seat_row}`);
      } else if (nonWindowSeats.length > 0) {
        const seat = nonWindowSeats.shift();
        if (seat) {
          assignedSeats.push(seat);
          const seatTypeDisplay = this.normalizeSeatType(group.seatType).toUpperCase();
          console.log(`👶 Menor ${minor.name} (${seatTypeDisplay}) asignado a ${seat.seat_column}${seat.seat_row} (sin ventana)`);
        }
      }
    });

    // PASO 2: Asignar adultos cerca de menores
    const remainingSeats = [
      ...windowSeats.slice(minors.length),
      ...nonWindowSeats
    ];

    // Ordenar por proximidad si hay menores asignados
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
        const seatTypeDisplay = this.normalizeSeatType(group.seatType).toUpperCase();
        console.log(`👨 Adulto ${adult.name} (${seatTypeDisplay}) asignado a ${remainingSeats[index].seat_column}${remainingSeats[index].seat_row}`);
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
    
    return ['A']; // fallback
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

  private async saveSeatAssignments(boardingPasses: BoardingPass[]): Promise<void> {
    // TODO: Uncomment when database UPDATE permissions are granted
    /*
    for (const bp of boardingPasses) {
      if (bp.seat) {
        await this.boardingPassRepo.update(
          bp.boarding_pass_id, 
          { seat: bp.seat }
        );
      }
    }
    */
    console.log(`💾 ${boardingPasses.length} asignaciones simuladas (no guardadas en BD debido a permisos)`);
  }

  // NUEVO: Resumen mejorado con desglose por clase
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
          // Se cuenta como business para efectos del resumen
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

    // Log del resumen
    console.log('\n=== RESUMEN DE ASIGNACIÓN ===');
    console.log(`🥇 Primera Clase: ${summary.firstClassProcessed} pasajeros`);
    console.log(`🥈 Business/Premium: ${summary.businessClassProcessed} pasajeros`);
    console.log(`🥉 Economy: ${summary.economyClassProcessed} pasajeros`);
    console.log(`👨‍👩‍👧‍👦 Menores con adultos: ${summary.minorsWithAdults}`);
    console.log(`✅ Total asignados: ${summary.assignedSeats}/${summary.totalPassengers}`);
    console.log('============================\n');

    return summary;
  }
}