import { Inject, Injectable, Logger } from '@nestjs/common';
import { type Pool } from 'mysql2/promise';
import { randomUUID } from 'crypto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject('DATABASE_CONNECTION') private readonly db: Pool) {}

  /**
   * Enregistre une action dans le journal d'audit.
   * @param userId L'ID de l'utilisateur (ou de la clé API) qui a effectué l'action.
   * @param action Une description de l'action (ex: 'CREATE_DOCUMENT').
   * @param details Un objet contenant des informations contextuelles (ex: l'ID du document).
   */
  async logAction(userId: string, action: string, details: object): Promise<void> {
    const id = randomUUID();
    try {
      await this.db.execute(
        'INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [id, userId, action, JSON.stringify(details)],
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Échec de l'enregistrement de l'action d'audit: ${action}`, error.stack);
      } else {
        this.logger.error(`Échec de l'enregistrement de l'action d'audit: ${action}`, String(error));
      }
    }
  }
}