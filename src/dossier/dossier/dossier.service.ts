import { Injectable, Inject, InternalServerErrorException} from '@nestjs/common';
import * as mysql from 'mysql2/promise';
import { CreateDossierDto } from './dto/create-dossier.dto';
import { TransferDossierDto } from './dto/transfer-dossier.dto';

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
// Lister les dossiers avec filtres optionnels
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

  // ÉTAPE 5 : Créer un dossier (Transaction)
async create(createDossierDto: CreateDossierDto, employeeId: number) {
    // Notez qu'on ne déstructure plus le reference_code ici, on le génère !
    const { dossier_type_id, current_division_id, data } = createDossierDto;

    const connection = await this.db2.getConnection();
    await connection.beginTransaction();

    try {
      // --- 1. GÉNÉRATEUR AUTOMATIQUE DE RÉFÉRENCE ---
      const year = new Date().getFullYear();
      
      // On compte le nombre de dossiers existants pour cette année
      const [countRows]: any = await connection.query(
        `SELECT COUNT(*) as total FROM dossiers WHERE reference_code LIKE ?`,
        [`DOS-${year}-%`]
      );
      
      // On formate le numéro avec des zéros devant (ex: 0001, 0002)
      const sequenceNumber = countRows[0].total + 1;
      const sequenceString = sequenceNumber.toString().padStart(4, '0');
      
      const generatedReference = `DOS-${year}-${sequenceString}`;
      // -----------------------------------------------

      // --- 2. CRÉATION DU DOSSIER ---
      // On ajoute created_by_employee_id dans la requête SQL
      const [dossierResult]: any = await connection.query(
        `INSERT INTO dossiers (reference_code, dossier_type_id, current_division_id, created_by_employee_id, data) 
         VALUES (?, ?, ?, ?, ?)`,
        [generatedReference, dossier_type_id, current_division_id, employeeId, JSON.stringify(data)]
      );

      const dossierId = dossierResult.insertId;

// --- 3. TRAÇABILITÉ (HISTORIQUE) ---
      // On utilise les bons noms de colonnes et on renseigne le status obligatoire
      // action_type_id = 1 correspond à 'CREATION' dans votre table action_types
      await connection.query(
        `INSERT INTO dossier_movements (dossier_id, source_division_id, destination_division_id, employee_id, action_type_id, new_status)
         VALUES (?, NULL, ?, ?, ?, ?)`,
        [dossierId, current_division_id, employeeId, 1, 'ouvert']
      );

      await connection.commit();

      return { 
        message: 'Dossier créé avec succès', 
        dossierId, 
        reference_code: generatedReference // On renvoie la référence générée au front-end !
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  //  Mettre à jour le contenu JSON d'un dossier
  async update(id: number, dto: any) { // Remplacez any par UpdateDossierDto si vous l'importez
    // 1. On vérifie que le dossier existe
    const existingDossier = await this.findOne(id);
    if (!existingDossier) {
      throw new Error('Dossier introuvable'); 
      // Si vous avez importé NotFoundException de @nestjs/common, c'est encore mieux !
    }

    // 2. On effectue la mise à jour
    await this.db2.query(
      'UPDATE dossiers SET data = ? WHERE id = ?',
      [JSON.stringify(dto.data), id]
    );

    return { 
      message: 'Dossier mis à jour avec succès', 
      id 
    };
  }




  // --- MOTEUR DE RÈGLES ---
  private async checkVisibility(sourceDivisionId: number, targetDivisionId: number): Promise<boolean> {
    // 1. Est-ce qu'une exception autorise ou bloque ce mouvement spécifique ?
    const [exceptions]: any = await this.db2.query(
      'SELECT is_allowed FROM division_visibility_exceptions WHERE source_division_id = ? AND target_division_id = ?',
      [sourceDivisionId, targetDivisionId]
    );
    if (exceptions.length > 0) return !!exceptions[0].is_allowed;

    // 2. Quel est le niveau de la division source ?
    const [divisions]: any = await this.db2.query(
      `SELECT dl.sees_all, d.level_id 
       FROM divisions d 
       JOIN division_levels dl ON d.level_id = dl.id 
       WHERE d.id = ?`,
      [sourceDivisionId]
    );
    if (divisions.length === 0) return false;

    const { sees_all, level_id } = divisions[0];

    // 3. Si le niveau permet de tout voir (ex: Direction)
    if (sees_all) return true;

    // 4. Sinon, on vérifie la portée de visibilité (scope)
    const [scopes]: any = await this.db2.query(
      'SELECT id FROM division_visibility_scope WHERE level_id = ? AND target_division_id = ?',
      [level_id, targetDivisionId]
    );
    return scopes.length > 0;
  }

  // --- ÉTAPE 7 : TRANSFÉRER UN DOSSIER ---
  async transfer(id: number, dto: TransferDossierDto, employeeId: number) {
    // 1. Récupérer l'état actuel du dossier
    const dossier = await this.findOne(id);
    if (!dossier) throw new Error('Dossier introuvable');

    const sourceDivisionId = dossier.current_division_id;
    const previousStatus = dossier.status;

    // 2. Vérifier les droits de déplacement
    const canMove = await this.checkVisibility(sourceDivisionId, dto.destination_division_id);
    if (!canMove) {
      throw new Error("Règle de visibilité : transfert non autorisé vers cette division.");
    }

    // 3. Exécuter la transaction SQL
    const connection = await this.db2.getConnection();
    try {
      await connection.beginTransaction();

      // Mise à jour du dossier
      await connection.query(
        'UPDATE dossiers SET current_division_id = ?, status = ? WHERE id = ?',
        [dto.destination_division_id, dto.new_status, id]
      );

      // Création de l'historique (Action_type 2 = TRANSFERT)
      await connection.query(
        `INSERT INTO dossier_movements 
        (dossier_id, source_division_id, destination_division_id, employee_id, action_type_id, previous_status, new_status, comment) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          sourceDivisionId,
          dto.destination_division_id,
          employeeId,
          2, // TRANSFERT
          previousStatus,
          dto.new_status,
          dto.comment || null
        ]
      );

      await connection.commit();
      return { message: 'Dossier transféré avec succès' };

    } catch (error) {
      await connection.rollback();
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error('Erreur lors du transfert : ' + errorMessage);
    } finally {
      connection.release();
    }
  }

// ETAPE 8  Récupérer l'historique d'un dossier
  async getHistory(dossierId: number) {
    const dossier = await this.findOne(dossierId);
    if (!dossier) throw new Error('Dossier introuvable');

    const [movements] = await this.db2.query(
      `SELECT * 
       FROM dossier_movements 
       WHERE dossier_id = ? 
       ORDER BY action_date DESC`, // <-- Utilisation de 'action_date' qui existe dans votre table
      [dossierId]
    );

    return movements;
  }

// On ajoute les paramètres optionnels search et date
  async getDivisionHistory(divisionId: number, search?: string, date?: string) {
    const connection = await this.db2.getConnection();
    try {
      // La base de la requête SQL
      let sql = `
        SELECT 
          dm.id, 
          d.reference_code AS reference, 
          act.code AS action, 
          dm.action_date AS date, 
          CONCAT(emp.first_name, ' ', emp.last_name) AS agent, 
          IFNULL(dm.comment, act.label) AS description,
          curr_div.name AS currentDivision
         FROM dossier_movements dm
         JOIN dossiers d ON dm.dossier_id = d.id
         JOIN action_types act ON dm.action_type_id = act.id
         JOIN employees emp ON dm.employee_id = emp.id
         JOIN divisions curr_div ON d.current_division_id = curr_div.id
         WHERE (dm.source_division_id = ? OR dm.destination_division_id = ?)
      `;
      const params: any[] = [divisionId, divisionId];

      // Si l'agent a tapé une recherche, on filtre sur la référence
      if (search) {
        sql += ` AND d.reference_code LIKE ?`;
        params.push(`%${search}%`);
      }

      // Si l'agent a choisi une date, on filtre sur la date d'action
      if (date) {
        // La fonction DATE() de MySQL ignore l'heure et compare juste le jour
        sql += ` AND DATE(dm.action_date) = ?`;
        params.push(date); 
      }

      sql += ` ORDER BY dm.action_date DESC LIMIT 50`;

      const [rows] = await connection.query(sql, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  // Récupérer la file d'attente d'une division
  async getDossiersByDivision(divisionId: number) {
    const connection = await this.db2.getConnection();
    try {
      // On fait une jointure pour récupérer le vrai nom du type de dossier
      const [rows] = await connection.query(
        `SELECT 
          d.id, 
          d.reference_code AS reference, 
          dt.name AS type, 
          d.created_at AS date, 
          d.status 
         FROM dossiers d
         JOIN dossier_types dt ON d.dossier_type_id = dt.id
         WHERE d.current_division_id = ?
         ORDER BY d.created_at DESC`,
        [divisionId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  // Récupérer le circuit complet d'un dossier
  async getDossierCircuit(dossierId: number) {
    const connection = await this.db2.getConnection();
    try {
      const [rows] = await connection.query(
        `SELECT 
          dm.id, 
          dm.action_date AS date, 
          act.label AS action, 
          src.name AS from_division, 
          dest.name AS to_division, 
          CONCAT(emp.first_name, ' ', emp.last_name) AS agent,
          dm.comment,
          dm.new_status AS status
         FROM dossier_movements dm
         JOIN action_types act ON dm.action_type_id = act.id
         LEFT JOIN divisions src ON dm.source_division_id = src.id
         JOIN divisions dest ON dm.destination_division_id = dest.id
         JOIN employees emp ON dm.employee_id = emp.id
         WHERE dm.dossier_id = ?
         ORDER BY dm.action_date ASC`, // ASC pour l'ordre chronologique (du plus ancien au plus récent)
        [dossierId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }
  
  // Recherche multicritère de dossiers
  async searchDossiers(filters: { reference?: string; status?: string; type_id?: string; date?: string; division_id?: string ; objet?: string}) {
    const connection = await this.db2.getConnection();
    try {
      // Le "WHERE 1=1" est une astuce classique pour pouvoir ajouter des "AND" dynamiquement
      let sql = `
        SELECT 
          d.id, 
          d.reference_code AS reference, 
          dt.name AS type, 
          d.status, 
          d.created_at AS date,
          divi.name AS current_division
        FROM dossiers d
        JOIN dossier_types dt ON d.dossier_type_id = dt.id
        JOIN divisions divi ON d.current_division_id = divi.id
        WHERE 1=1 
      `;
      const params: any[] = [];

      if (filters.reference) {
        sql += ` AND d.reference_code LIKE ?`;
        params.push(`%${filters.reference}%`);
      }
      if (filters.status) {
        sql += ` AND d.status = ?`;
        params.push(filters.status);
      }
      if (filters.type_id) {
        sql += ` AND d.dossier_type_id = ?`;
        params.push(filters.type_id);
      }
      if (filters.date) {
        sql += ` AND DATE(d.created_at) = ?`;
        params.push(filters.date);
      }
      if (filters.division_id) {
        sql += ` AND d.current_division_id = ?`;
        params.push(filters.division_id);
      }
     // NOUVEAU : Recherche à l'intérieur du JSON
      if (filters.objet) {
        // d.data->>'$.objet' va chercher la clé "objet" dans le JSON
        sql += ` AND d.data->>'$.objet' LIKE ?`;
        params.push(`%${filters.objet}%`);
      }

      sql += ` ORDER BY d.created_at DESC LIMIT 100`; // Limite de sécurité

      const [rows] = await connection.query(sql, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  // Récupérer les détails complets d'un dossier
  async getDossierDetails(id: number) {
    const connection = await this.db2.getConnection();
    try {
      const [rows]: any = await connection.query(
        `SELECT 
          d.id, 
          d.reference_code AS reference, 
          dt.name AS type, 
          d.status, 
          d.data,
          d.created_at
         FROM dossiers d
         JOIN dossier_types dt ON d.dossier_type_id = dt.id
         WHERE d.id = ?`,
        [id]
      );

      if (rows.length === 0) {
        throw new Error("Dossier introuvable");
      }

      return rows[0]; // On retourne l'objet unique
    } finally {
      connection.release();
    }
  }

async updateData(id: number, newData: any) {
    const connection = await this.db2.getConnection();
    try {
      const jsonString = JSON.stringify(newData);

      const [result] = await connection.query(
        `UPDATE dossiers SET data = ? WHERE id = ?`,
        [jsonString, id]
      );

      // CORRECTION ICI : On dit à TypeScript de ne pas bloquer l'analyse de cette variable
      if ((result as any).affectedRows === 0) {
        throw new Error("Dossier introuvable");
      }

      return { message: 'Bandeau mis à jour avec succès' };
    } catch (error) {
      console.error("Erreur SQL lors de la mise à jour du bandeau :", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // à testena ny latance apres plusieur millier de dossier
  async getDistinctMinisteres(): Promise<string[]> {
  const connection = await this.db2.getConnection();
  try {
    // Extraction MySQL du champ 'ministere' contenu dans le JSON 'data'
    const [rows] = await connection.query(`
      SELECT DISTINCT JSON_UNQUOTE(JSON_EXTRACT(data, '$.ministere')) AS ministere
      FROM dossiers
      WHERE JSON_EXTRACT(data, '$.ministere') IS NOT NULL
        AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.ministere')) != ''
      ORDER BY ministere ASC
    `);

    return (rows as any[])
      .map(r => r.ministere)
      .filter(Boolean);
  } catch (error) {
    console.error("Erreur lors de la récupération des ministères :", error);
    throw error;
  } finally {
    connection.release();
  }
}


}