import { Module } from '@nestjs/common';
import { AirlinesModule } from './airlines/airlines.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flight } from './airlines/entities/flight.entity';
import { Passenger } from './airlines/entities/passenger.entity';
import { Airplane, BoardingPass, Purchase, Seat, SeatType } from './airlines/entities';

@Module({
  imports: [TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'mdb-test.c6vunyturrl6.us-west-1.rds.amazonaws.com',
      port: 3306,
      username: 'postulaciones',
      password: 'post123456',
      database: 'airline',
      entities: [Flight,
        Passenger,
        BoardingPass,
        Seat,
        SeatType,
        Airplane,
        Purchase,], // agrega aquí todas tus entidades
      synchronize: false, // solo lectura, no queremos modificar DB
      retryAttempts: 5,   // intentos de reconexión
      retryDelay: 3000,   // 3 segundos entre intentos
       extra: {
        connectionLimit: 5,
        acquireTimeout: 10000,
        timeout: 10000,
        reconnect: true,
        reconnectDelay: 1000,
        maxReconnectAttempts: 5,
        // Configuraciones específicas de MySQL2 para RDS
        ssl: false,
        charset: 'utf8mb4_unicode_ci',
        timezone: 'Z',
        // Importante: cierra conexiones inactivas rápidamente
        idleTimeout: 4000, // 4 segundos, menos que los 5 del servidor
        evictIdleConnections: true,
      },
      // Pool pequeño y conexiones cortas
      poolSize: 3,
      maxQueryExecutionTime: 4000, // 4 segundos
      connectTimeout: 10000,
      acquireTimeout: 10000,
    }),
   AirlinesModule 
  ],
})
export class AppModule {}
 