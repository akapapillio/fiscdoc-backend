import { Module } from '@nestjs/common';
import { DivisionController } from './division.controller';
import { DivisionService } from './division.service';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [DivisionController],
  providers: [DivisionService],
  exports: [DivisionService], // On l'exporte au cas où le module Dossier aurait besoin de l'utiliser un jour
})
export class DivisionModule {}