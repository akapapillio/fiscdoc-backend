import { Controller, Get } from '@nestjs/common';
import { DossierService } from './dossier.service';

@Controller('dossiers')
export class DossierController {
  constructor(private readonly dossierService: DossierService) {}

  @Get('ping')
  async ping() {
    return this.dossierService.pingDb();
  }
}