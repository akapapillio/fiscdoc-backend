import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class DivisionService {
  constructor(@Inject('DATABASE_CONNECTION2') private db2: any) {}

  // 1. LIRE : Récupérer toutes les divisions et leurs droits hérités du NIVEAU
  async findAll() {
    const connection = await this.db2.getConnection();
    try {
      // On joint les niveaux pour savoir si on voit tout (sees_all) 
      // ou si on doit lire division_visibility_scope
      const [rows] = await connection.query(`
        SELECT 
          d.id, d.name, d.code, d.is_active, d.level_id,
          dl.label AS level_name,
          dl.sees_all,
          IF(dl.sees_all = TRUE, 
            JSON_ARRAY('ALL'), 
            IFNULL(
              (SELECT JSON_ARRAYAGG(dvs.target_division_id) 
               FROM division_visibility_scope dvs 
               WHERE dvs.level_id = d.level_id), 
            JSON_ARRAY())
          ) AS allowed_transfers
        FROM divisions d
        JOIN division_levels dl ON d.level_id = dl.id
        ORDER BY d.id ASC
      `);
      return rows;
    } finally {
      connection.release();
    }
  }

  // 2. CRÉER : On ne sauvegarde plus des cibles, mais un level_id !
  async create(data: { name: string; code: string; level_id: number }) {
    const connection = await this.db2.getConnection();
    try {
      const [result] = await connection.query(
        `INSERT INTO divisions (name, code, level_id, is_active) VALUES (?, ?, ?, ?)`,
        [data.name, data.code, data.level_id, true]
      );
      return { id: result.insertId, message: 'Division créée avec son niveau.' };
    } finally {
      connection.release();
    }
  }

  // 3. MODIFIER : Changer le nom, le code ou changer la division de Niveau
  async update(id: number, data: { name: string; code: string; level_id: number }) {
    const connection = await this.db2.getConnection();
    try {
      await connection.query(
        `UPDATE divisions SET name = ?, code = ?, level_id = ? WHERE id = ?`,
        [data.name, data.code, data.level_id, id]
      );
      return { message: 'Division mise à jour.' };
    } finally {
      connection.release();
    }
  }

  // 4. SUPPRIMER
  async remove(id: number) {
    const connection = await this.db2.getConnection();
    try {
      await connection.query(`DELETE FROM divisions WHERE id = ?`, [id]);
      return { message: 'Division supprimée' };
    } finally {
      connection.release();
    }
  }
}