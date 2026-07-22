import {
  Body,
  BadRequestException,
  Controller,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
// Supposons que vous ayez un UsersService pour vérifier l'utilisateur
// import { UsersService } from 'src/modules/users/users.service';

@UseGuards(ApiKeyGuard) // On protège toutes les routes de ce contrôleur
@Controller('keys')
export class ApiKeysController {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    // private readonly usersService: UsersService, // À injecter
  ) {}

  @Post()
  async create(@Body(new ValidationPipe()) createApiKeyDto: CreateApiKeyDto) {
    // Remplacement du TODO par une vérification réelle
    // const userExists = await this.usersService.findById(createApiKeyDto.userId);
    // if (!userExists) {
    //   throw new BadRequestException(`L'utilisateur avec l'ID "${createApiKeyDto.userId}" n'existe pas.`);
    // }
    return this.apiKeysService.createApiKey(createApiKeyDto);
  }

  @Patch(':id/suspend')
  async suspend(@Param('id') id: string) {
    const affectedRows = await this.apiKeysService.updateApiKeyStatus(id, false);
    if (affectedRows === 0) {
      throw new NotFoundException(`La clé d'API avec l'ID "${id}" n'a pas été trouvée.`);
    }
    return { message: 'Clé d\'API suspendue avec succès.' };
  }

  @Patch(':id/reactivate')
  async reactivate(@Param('id') id: string) {
    const affectedRows = await this.apiKeysService.updateApiKeyStatus(id, true);
    if (affectedRows === 0) {
      throw new NotFoundException(`La clé d'API avec l'ID "${id}" n'a pas été trouvée.`);
    }
    return { message: 'Clé d\'API réactivée avec succès.' };
  }
}