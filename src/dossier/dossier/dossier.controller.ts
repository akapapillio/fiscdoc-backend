import { UseGuards ,Controller, Get , Post , Body, Query, Param, ParseIntPipe, Patch,Request , BadRequestException  } from '@nestjs/common';
import { DossierService } from './dossier.service';
import { CreateDossierDto } from './dto/create-dossier.dto';
import { UpdateDossierDto } from './dto/update-dossier.dto';
import { TransferDossierDto } from './dto/transfer-dossier.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dossiers')
export class DossierController {
  constructor(private readonly dossierService: DossierService) {}

  @Get('ping')
  async ping() {
    return this.dossierService.pingDb();
  }

  @Get()
    async findAll(
      @Query('divisionId') divisionId?: string,
      @Query('status') status?: string,
    ) {
      // Si divisionId est fourni dans l'URL, on le convertit en nombre
      const parsedDivisionId = divisionId ? parseInt(divisionId, 10) : undefined;
      
      return this.dossierService.findAll(parsedDivisionId, status);
  }

  @Get('search')
  async search(@Query() query: any) {
    return this.dossierService.searchDossiers(query);
  }

  // @Get(':id')
  //   async findOne(@Param('id', ParseIntPipe) id: number) {
  //     return this.dossierService.findOne(id);
  //   }

  @Post()
    async create(@Body() createDossierDto: CreateDossierDto ,@Request() req) {
      // Note temporaire : On "simule" que l'agent connecté est l'employé ID 1.
      // Plus tard, on récupérera cet ID via le token de sécurité (@CurrentUser() ou Request).
      // const currentEmployeeId = 1; 
      const currentEmployeeId = req.user.sub;
      return this.dossierService.create(createDossierDto, currentEmployeeId);
    }

    @Patch(':id')
    async update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateDossierDto: UpdateDossierDto
    ) {
      return this.dossierService.update(id, updateDossierDto);
    }

    // 7 Transfer  ---
  @Post(':id/transfer')
  async transfer(
    @Param('id', ParseIntPipe) id: number,
    @Body() transferDossierDto: TransferDossierDto,
    @Request() req
  ) {
    // const currentEmployeeId = 1; // Toujours simulé pour le moment
    const currentEmployeeId = req.user.sub;
    
    // Si la logique renvoie une erreur (ex: transfert non autorisé), NestJS la gérera
  try {
      return await this.dossierService.transfer(id, transferDossierDto, currentEmployeeId);
    } catch (error) {
      // On retourne une erreur propre au front-end (Code 400 Bad Request)
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(errorMessage); 
    }
  }

  // --- ETAPE 8 --- historique des mvm
  @Get(':id/movements')
  async getHistory(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.dossierService.getHistory(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(errorMessage);
    }
  }
  // GET /dossiers/division/:divisionId/history
 @Get('division/:divisionId/history')
   async getHistoryDiv(
      @Param('divisionId') divisionId: string,
      @Query('search') search?: string, 
      @Query('date') date?: string   
    ) {
      return this.dossierService.getDivisionHistory(Number(divisionId), search, date);
  }

  // GET /dossiers/division/:divisionId
  @Get('division/:divisionId')
  async getDossiersByDivision(@Param('divisionId') divisionId: string) {
    return this.dossierService.getDossiersByDivision(Number(divisionId));
  }

  // GET /dossiers/:id/circuit
  @Get(':id/circuit')
  async getCircuit(@Param('id') id: string) {
    return this.dossierService.getDossierCircuit(Number(id));
  }
    //route dependans des donnee initial
  @Get('ministeres')
  async getMinisteres() {
    return this.dossierService.getDistinctMinisteres();
 }

  // GET /dossiers/:id
  @Get(':id')
  async getDossierDetails(@Param('id') id: string) {
    return this.dossierService.getDossierDetails(Number(id));
  }
  
  @Patch(':id/data')
  async updateData(@Param('id') id: string, @Body() body: { data: any }) {
    return this.dossierService.updateData(Number(id), body.data);
  }

  
}

