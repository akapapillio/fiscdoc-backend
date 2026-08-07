import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  ValidationPipe,
  Patch, // Import Patch
  Param, // Import Param
  Query,
} from '@nestjs/common';
import { ApiKeyGuard } from 'src/common/guards/api-key.guard';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto'; // Import UpdateDocumentDto
import { QueryDocumentDto } from './dto/query-document.dto';
import { AuditService } from '../audit/audit.service';


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
   * Récupère une liste de documents, potentiellement filtrée.
   * @param queryDto Les paramètres de filtrage (status, category_id).
   */
  @Get()
  async findAll(@Query(new ValidationPipe({ transform: true })) queryDto: QueryDocumentDto) {
    return this.documentsService.findAll(queryDto);
  }

  /**
   * Récupère un document spécifique par son ID.
   * @param id L'ID du document à récupérer.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
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