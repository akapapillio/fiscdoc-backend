import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';
import { AppController } from './app.controller'; // Bien importé !

@Module({
  imports: [
    // 1. Charge le fichier .env de manière globale
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController], // <-- C'est ICI qu'il fallait l'ajouter pour exposer l'endpoint !
  providers: [
    // 2. Crée le fournisseur de connexion MySQL réutilisable
    {
      provide: 'DATABASE_CONNECTION',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return mysql.createPool({
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          user: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });
      },
    },
  ],
  // 3. Exporte la connexion pour que tes futurs modules puissent l'utiliser
  exports: ['DATABASE_CONNECTION'],
})
export class AppModule {}