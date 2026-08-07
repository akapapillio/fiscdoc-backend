import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DocumentStatus } from './enums/document-status.enum';
import { type Pool, type RowDataPacket } from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: Pool,
    private readonly auditService: AuditService,
  ) {}

  /** 
   * @param auditService
   * 
   * Crée un nouveau document en base de données.
   * @param createDocumentDto Les données du document.
   * @param authorId L'ID de l'auteur (récupéré depuis le token API).
   * @returns Le document nouvellement créé.
   */
  async create(
    createDocumentDto: CreateDocumentDto,
    authorId: string,
  ): Promise<any> {
    const id = randomUUID();
    const document = {
      id,
      ...createDocumentDto,
      status: createDocumentDto.status || DocumentStatus.BROUILLON, // Statut par défaut
      author_id: authorId,
    };

    await this.db.execute(
      'INSERT INTO documents (id, title, category_id, html_content, status, author_id) VALUES (?, ?, ?, ?, ?, ?)',
      [document.id, document.title, document.category_id, document.html_content, document.status, document.author_id],
    );

    await this.auditService.logAction(authorId, 'CREATE_DOCUMENT', {
      documentId: id,
      title: document.title,
    });

    this.logger.log(`Document créé avec l'ID : ${id}`);
    return this.findOne(id);
  }

  /**
   * Récupère une liste de documents, avec filtres optionnels.
   * @param queryDto Filtres de recherche (status, category_id).
   * @returns Une liste de documents.
   */
  async findAll(queryDto: QueryDocumentDto): Promise<any[]> {
    let query = 'SELECT id, title, category_id, status, version, created_at, updated_at, author_id FROM documents WHERE 1=1';
    const params: string[] = [];

    if (queryDto.status) {
      query += ' AND status = ?';
      params.push(queryDto.status);
    }

    if (queryDto.category_id) {
      query += ' AND category_id = ?';
      params.push(queryDto.category_id);
    }

    const [rows] = await this.db.execute(query, params);
    return rows as any[];
  }

  /**
   * Récupère un document par son ID, avec son contenu complet.
   * @param id L'ID du document.
   * @returns Le document complet.
   */
  async findOne(id: string): Promise<any> {
    const [rows] = await this.db.execute<RowDataPacket[]>(
      'SELECT * FROM documents WHERE id = ?',
      [id],
    );

    if (rows.length === 0) {
      this.logger.warn(`Document non trouvé pour l'ID : ${id}`);
      throw new NotFoundException(`Le document avec l'ID "${id}" n'a pas été trouvé.`);
    }

    return rows[0];
  }

  /**
   * Met à jour un document existant.
   * @param doc_id L'ID du document à mettre à jour.
   * @param updateDocumentDto Les données du document à mettre à jour.
   * @param authorId L'ID de l'utilisateur qui effectue la mise à jour (provient du guard).
   */
  async update(doc_id: string, updateDocumentDto: UpdateDocumentDto, authorId: string): Promise<any> {
    // 1. Vérifier que le document existe avant de tenter la mise à jour
    await this.findOne(doc_id);

    const fields = Object.keys(updateDocumentDto);
    // Si le corps de la requête est vide, on ne fait rien et on retourne le document actuel.
    if (fields.length === 0) {
      return this.findOne(doc_id);
    }
    
    // 2. Construire la requête de mise à jour dynamiquement
    const updateFields = Object.entries(updateDocumentDto)
      .filter(([, value]) => value !== undefined);

    const setClause = updateFields.map(([key]) => `\`${key}\` = ?`).join(', ');
    const params = [...updateFields.map(([, value]) => value), authorId, doc_id];

    const query = `UPDATE \`documents\` SET ${setClause}, \`author_id\` = ?, \`version\` = \`version\` + 1 WHERE id = ?`;
    const [result] = await this.db.execute(query, params);

    if ((result as any).affectedRows === 0) {
      // Ce cas est peu probable grâce au findOne() initial, mais c'est une sécurité supplémentaire.
      throw new NotFoundException(`Le document avec l'ID "${doc_id}" n'a pas été trouvé.`);
    }

    // 3. Journaliser l'action d'audit
    await this.auditService.logAction(authorId, 'UPDATE_DOCUMENT', {
      documentId: doc_id,
      fields: Object.keys(updateDocumentDto),
    });

    this.logger.log(`Document mis à jour avec l'ID : ${doc_id}`);
    // 4. Retourner l'entité complète et à jour
    return this.findOne(doc_id);
  }
}