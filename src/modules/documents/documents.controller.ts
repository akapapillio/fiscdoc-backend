import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@UseGuards(ApiKeyGuard) // On protège toutes les routes de ce contrôleur
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * Crée un nouveau document.
   * Le `ApiKeyGuard` s'assure que la requête est authentifiée et attache
   * les informations de la clé (dont `user_id`) à l'objet `req`.
   */
  @Post()
  async create(
    @Body(new ValidationPipe()) createDocumentDto: CreateDocumentDto,
    @Req() req: any, // On récupère l'objet Request
  ) {
    const authorId = req.user.userId; // `userId` est attaché par le ApiKeyGuard
    return this.documentsService.create(createDocumentDto, authorId);
  }
}