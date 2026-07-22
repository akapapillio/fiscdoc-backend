import { Controller, Get, Inject, InternalServerErrorException ,   Body,
  BadRequestException,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  ValidationPipe } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';

@Controller()
export class AppController {
  constructor(@Inject('DATABASE_CONNECTION') private readonly db: mysql.Pool) {}

  @Get('api-status')
  async checkStatus() {
    try {
      await this.db.query('SELECT 1');
      
      return {
        status: 'OK',
        message: 'Le backend FiscDoc fonctionne parfaitement !',
        database: 'Connectée à MariaDB (InnoDB)',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) { // En ajoutant ": any", on dit à TypeScript de nous laisser lire .message
      // Alternative ultra-robuste si tu préfères éviter "any" : 
      // const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

      throw new InternalServerErrorException({
        status: 'ERROR',
        message: 'Le serveur NestJS tourne, mais impossible de joindre la base MariaDB.',
        error: error?.message || 'Erreur inconnue',
      });
    }
  }
}