import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';

export const databaseProvider: Provider = {
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
};