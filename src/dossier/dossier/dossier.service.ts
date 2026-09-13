import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
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
}