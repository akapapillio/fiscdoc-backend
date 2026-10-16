import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      global: true, // Rend le JwtService disponible partout
      secret: 'VOTRE_CLE_SECRETE_TRES_COMPLEXE_ICI', // À mettre dans un fichier .env plus tard
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}