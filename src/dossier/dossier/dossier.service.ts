import { Injectable, Inject } from '@nestjs/common';
import * as mysql from 'mysql2/promise';

@Injectable()
export class DossierService {
  constructor(
    @Inject('DATABASE_CONNECTION2') private readonly db2: mysql.Pool,
  ) {}

  async pingDb() {
    // Test simple pour vérifier que la base 2 répond
    const [rows] = await this.db2.query('SELECT 1 as is_connected');
    return rows;
  }
}