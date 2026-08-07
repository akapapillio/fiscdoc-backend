import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from 'src/common/database/database.module';
import { AuditService } from './audit.service';

@Global() // Rend le service disponible dans toute l'application
@Module({
  imports: [DatabaseModule],
  providers: [AuditService],
  exports: [AuditService], // Exporte le service pour l'injection de dépendances
})
export class AuditModule {}