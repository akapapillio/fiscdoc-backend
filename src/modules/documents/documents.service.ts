import { Inject, Injectable, Logger } from '@nestjs/common';
import { type Pool } from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { CreateDocumentDto } from './dto/create-document.dto';

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
}