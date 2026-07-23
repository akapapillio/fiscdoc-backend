import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/common/database/database.module';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

@Module({
  imports: [DatabaseModule], // On importe le module qui fournit la connexion DB
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
  exports: [ApiKeysService], // On exporte le service pour l'utiliser dans le Guard
})
export class ApiKeysModule {}