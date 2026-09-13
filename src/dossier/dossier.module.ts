import { Module } from '@nestjs/common';
import { DossierController } from './dossier.controller';
import { DossierService } from './dossier.service';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [DossierController],
  providers: [DossierService],
})
export class DossierModule {}