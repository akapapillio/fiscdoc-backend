import { Controller, Get , Post , Body  } from '@nestjs/common';
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
}

