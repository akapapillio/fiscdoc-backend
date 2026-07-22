import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiKeysService } from 'src/modules/api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const publicKey = request.headers['x-api-key'] as string;
    const secret = request.headers['x-api-secret'] as string;

    if (!publicKey || !secret) {
      throw new UnauthorizedException(
        'Les en-têtes x-api-key et x-api-secret sont requis.',
      );
    }

    const apiKey = await this.apiKeysService.validateApiKey(publicKey, secret);

    if (!apiKey) {
      throw new UnauthorizedException('Clé d\'API ou secret invalide.');
    }

    // Optionnel : attacher des informations sur la clé à la requête pour un usage ultérieur
    // (request as any).apiKey = apiKey;

    return true;
  }
}