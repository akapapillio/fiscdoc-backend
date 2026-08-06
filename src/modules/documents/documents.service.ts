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

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(@Inject('DATABASE_CONNECTION') private readonly db: Pool) {}

  /**
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
    const { title, category_id, html_content, status } = updateDocumentDto;
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      fieldsToUpdate.push('title = ?');
      values.push(title);
    }
    if (category_id !== undefined) {
      fieldsToUpdate.push('category_id = ?');
      values.push(category_id);
    }
    if (html_content !== undefined) {
      fieldsToUpdate.push('html_content = ?');
      values.push(html_content);
    }
    if (status !== undefined) {
      fieldsToUpdate.push('status = ?');
      values.push(status);
    }

    if (fieldsToUpdate.length === 0) {
      this.logger.warn(`No fields provided for updating document with ID ${doc_id}.`);
      return { message: 'No fields to update.' };
    }

    const query = `UPDATE \`documents\` SET ${fieldsToUpdate.join(', ')} WHERE id = ? AND author_id = ?`;
    values.push(doc_id);
    values.push(authorId);

    const [result] = await this.db.execute(query, values);

    if ((result as any).affectedRows === 0) {
      throw new NotFoundException(`Document with ID "${doc_id}" not found or you are not authorized to update it.`);
    }

    this.logger.log(`Document "${doc_id}" updated by author "${authorId}".`);
    return { id: doc_id, ...updateDocumentDto, author_id: authorId, message: 'Document updated successfully.' };
  }
}