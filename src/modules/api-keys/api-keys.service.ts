import { Inject, Injectable, Logger } from '@nestjs/common';
import { type Pool } from 'mysql2/promise';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: Pool,
  ) {}

  /**
   * Valide un couple clé publique / secret.
   * @param publicKey La clé publique fournie.
   * @param secret Le secret en clair fourni.
   * @returns L'enregistrement de la clé si elle est valide, sinon null.
   */
  async validateApiKey(
    publicKey: string,
    secret: string,
  ): Promise<any | null> {
    const [rows]: [any[], any] = await this.db.execute(
      `SELECT id, name, hashed_secret, user_id 
       FROM api_keys 
       WHERE public_key = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())`,
      [publicKey],
    );

    if (rows.length === 0) {
      this.logger.warn(`Validation échouée : clé publique "${publicKey}" non trouvée, inactive ou expirée.`);
      return null; // Clé non trouvée, inactive ou expirée
    }

    const apiKey = rows[0];
    const isSecretMatching = await bcrypt.compare(secret, apiKey.hashed_secret);

    if (!isSecretMatching) {
      this.logger.warn(`Validation échouée : le secret pour la clé publique "${publicKey}" ne correspond pas.`);
    }

    return isSecretMatching ? apiKey : null;
  }

  /**
   * Crée et stocke une nouvelle clé d'API.
   * @param createApiKeyDto Les données pour la création de la clé.
   * @returns La clé publique et le secret en clair (à n'afficher qu'une seule fois).
   */
  async createApiKey(
    createApiKeyDto: CreateApiKeyDto,
  ): Promise<{ publicKey: string; secret: string }> {
    // 1. Générer des identifiants uniques et sécurisés
    const id = randomUUID();
    const publicKey = `fpk_${randomUUID().replace(/-/g, '')}`.substring(0, 32);
    const secret = randomUUID(); // Le secret à fournir au client

    // 2. Hacher le secret avant de le stocker
    const saltRounds = 10;
    const hashedSecret = await bcrypt.hash(secret, saltRounds);

    // 3. Insérer la nouvelle clé dans la base de données
    await this.db.execute(
      `INSERT INTO api_keys (id, name, public_key, hashed_secret, user_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [id, createApiKeyDto.name, publicKey, hashedSecret, createApiKeyDto.userId],
    );

    // 4. Retourner la clé publique et le secret EN CLAIR
    return { publicKey, secret };
  }

  /**
   * Met à jour le statut (actif/inactif) d'une clé d'API.
   * @param id L'ID de la clé à mettre à jour.
   * @param isActive Le nouveau statut.
   * @returns Le nombre de lignes affectées.
   */
  async updateApiKeyStatus(id: string, isActive: boolean): Promise<number> {
    const [result]: [any, any] = await this.db.execute(
      'UPDATE api_keys SET is_active = ? WHERE id = ?', [isActive, id]);
    return result.affectedRows;
  }
}