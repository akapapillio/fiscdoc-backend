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
// ÉTAPE 3 : Lister les dossiers avec filtres optionnels
  async findAll(divisionId?: number, status?: string) {
    let sql = 'SELECT * FROM dossiers WHERE 1=1';
    const params: any[] = [];

    if (divisionId) {
      sql += ' AND current_division_id = ?';
      params.push(divisionId);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    // On trie du plus récent au plus ancien
    sql += ' ORDER BY created_at DESC';

    const [rows] = await this.db2.query(sql, params);
    return rows;
  }

  // par son ID
  async findOne(id: number) {
    const [rows]: any = await this.db2.query(
      'SELECT * FROM dossiers WHERE id = ?',
      [id]
    );
    
    // Si le dossier n'existe pas, on renvoie null
    return rows.length > 0 ? rows[0] : null;
  }

}