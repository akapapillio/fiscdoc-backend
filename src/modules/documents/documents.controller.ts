import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
  Patch, // Import Patch
  Param, // Import Param
} from '@nestjs/common';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto'; // Import UpdateDocumentDto


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

  /**
   * Met à jour un document existant.
   * @param doc_id L'ID du document à mettre à jour (extrait du paramètre d'URL).
   * @param updateDocumentDto Les données du document à mettre à jour.
   * @param req L'objet Request contenant les informations de l'utilisateur.
   */
  @Patch(':id') // Utilisation de PATCH pour les mises à jour partielles, avec l'ID dans l'URL
  async update(
    @Param('id') doc_id: string, // Extraction de l'ID du document depuis l'URL
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) updateDocumentDto: UpdateDocumentDto,
    @Req() req: any,
  ) {
    const authorId = req.user.userId;
    return this.documentsService.update(doc_id, updateDocumentDto, authorId);
  }
}