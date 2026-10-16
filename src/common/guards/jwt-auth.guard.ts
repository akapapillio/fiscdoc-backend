// Partie 2
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('Token d\'authentification manquant');
    }
    
    try {
      // Le JwtService global va utiliser le secret configuré dans AuthModule
      const payload = await this.jwtService.verifyAsync(token);
      
      // MAGIE : On attache les données de l'utilisateur (le payload du token) à la requête
      // Notre payload contenait { sub: user.id, email: user.email }
      request['user'] = payload; 
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
    
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}