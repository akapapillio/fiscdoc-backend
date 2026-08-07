import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller'; // Bien importé !
import { DatabaseModule } from './common/database/database.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    // 1. Charge le fichier .env de manière globale
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // 2. Importe le module de base de données
    DatabaseModule,
    // 3. Importe le module de gestion des clés d'API
    ApiKeysModule,
    CategoriesModule,
    DocumentsModule,
    // 4. Importe le module d'audit (global)
    AuditModule,
  ],
  controllers: [AppController], // <-- C'est ICI qu'il fallait l'ajouter pour exposer l'endpoint !
})
export class AppModule {}