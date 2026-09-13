import { Controller, Get , Post , Body, Query, Param, ParseIntPipe  } from '@nestjs/common';
import { DossierService } from './dossier.service';
import { CreateDossierDto } from './dto/create-dossier.dto';

@Controller('dossiers')
export class DossierController {
  constructor(private readonly dossierService: DossierService) {}

  @Get('ping')
  async ping() {
    return this.dossierService.pingDb();
  }

  // --- ROUTE DE TEST TEMPORAIRE ---
  @Post('test-validation')
  testDto(@Body() dto: CreateDossierDto) {
    return {
      message: 'Les données sont valides et prêtes à être insérées !',
      recu: dto
    };
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

}

