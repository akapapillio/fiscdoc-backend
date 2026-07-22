import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller'; // Bien importé !
import { DatabaseModule } from './common/database/database.module';


@Module({
  imports: [
    // 1. Charge le fichier .env de manière globale
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // 2. Importe le module de base de données
    DatabaseModule,
  ],
  controllers: [AppController], // <-- C'est ICI qu'il fallait l'ajouter pour exposer l'endpoint !
})
export class AppModule {}