import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { type Pool } from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto'; // Import UpdateDocumentDto
import { DocumentStatus } from './enums/document-status.enum'; // Import DocumentStatus enum
@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(@Inject('DATABASE_CONNECTION') private readonly db: Pool) {}

  /**
   * Crée un nouveau document et le stocke en base de données.
   * @param createDocumentDto Les données du document à créer.
   * @param authorId L'ID de l'utilisateur qui crée le document (provient du guard).
   */
  async create(createDocumentDto: CreateDocumentDto, authorId: string): Promise<any> {
    const id = randomUUID();
    const { title, category_id, html_content } = createDocumentDto;

    // Le statut par défaut est 'BROUILLON' comme dans le schéma SQL.
    await this.db.execute(
      'INSERT INTO `documents` (id, title, category_id, html_content, author_id, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, title, category_id, html_content, authorId, 'BROUILLON'],
    );

    this.logger.log(`Document "${title}" créé avec l'ID ${id}.`);
    return { id, ...createDocumentDto, author_id: authorId };
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