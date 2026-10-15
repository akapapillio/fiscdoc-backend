import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateDossierDto {
  // On le rend optionnel (ou on peut le supprimer totalement du DTO)
  @IsString()
  @IsOptional()
  reference_code?: string;

  @IsInt()
  dossier_type_id!: number;

  @IsInt()
  current_division_id!: number;

  @IsObject()
  data!: Record<string, any>;
}