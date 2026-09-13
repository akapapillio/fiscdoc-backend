import { IsObject, IsNotEmpty } from 'class-validator';

export class UpdateDossierDto {
  @IsObject()
  @IsNotEmpty({ message: 'Les nouvelles données du dossier sont requises' })
  data!: Record<string, any>;
}