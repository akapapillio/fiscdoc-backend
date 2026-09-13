import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import * as mysql from 'mysql2/promise';
import { CreateDossierDto } from './dto/create-dossier.dto';

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

  // ÉTAPE 5 : Créer un dossier (Transaction)
  async create(dto: CreateDossierDto, employeeId: number) {
    const connection = await this.db2.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Création du dossier
      const [dossierResult]: any = await connection.query(
        `INSERT INTO dossiers 
        (reference_code, dossier_type_id, status, current_division_id, created_by_employee_id, data) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          dto.reference_code,
          dto.dossier_type_id,
          'ouvert', // Statut par défaut à la création
          dto.current_division_id,
          employeeId,
          JSON.stringify(dto.data), // MySQL nécessite une string pour insérer dans un champ JSON
        ]
      );

      const newDossierId = dossierResult.insertId;

      // 2. Inscription dans le journal des mouvements
      // L'action_type_id 1 correspond à 'CREATION' dans notre jeu de données
      await connection.query(
        `INSERT INTO dossier_movements 
        (dossier_id, destination_division_id, employee_id, action_type_id, new_status, comment) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newDossierId,
          dto.current_division_id, // À la création, la division cible est la division initiale
          employeeId,
          1, // CREATION
          'ouvert',
          'Création initiale du dossier',
        ]
      );

      // On valide la transaction si tout s'est bien passé
      await connection.commit();
      
      return { 
        id: newDossierId, 
        message: 'Dossier créé avec succès et historisé' 
      };

    } catch (error) {
      // On annule la transaction
      await connection.rollback();
      
      // On extrait le message proprement pour satisfaire TypeScript
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException('Erreur lors de la création du dossier : ' + errorMessage);
      
    } finally {
      // Très important : on libère la connexion pour qu'elle retourne dans le pool
      connection.release();
    }
  }

}