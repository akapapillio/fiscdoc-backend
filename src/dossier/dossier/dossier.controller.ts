import { Controller, Get , Post , Body, Query, Param, ParseIntPipe, Patch  } from '@nestjs/common';
import { DossierService } from './dossier.service';
import { CreateDossierDto } from './dto/create-dossier.dto';
import { UpdateDossierDto } from './dto/update-dossier.dto';

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

  @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
      return this.dossierService.findOne(id);
    }
  @Post()
    async create(@Body() createDossierDto: CreateDossierDto) {
      // Note temporaire : On "simule" que l'agent connecté est l'employé ID 1.
      // Plus tard, on récupérera cet ID via le token de sécurité (@CurrentUser() ou Request).
      const currentEmployeeId = 1; 

      return this.dossierService.create(createDossierDto, currentEmployeeId);
    }

    @Patch(':id')
    async update(
      @Param('id', ParseIntPipe) id: number,
      @Body() updateDossierDto: UpdateDossierDto
    ) {
      return this.dossierService.update(id, updateDossierDto);
    }
}

