import { IsString, IsInt, IsNotEmpty, IsObject } from 'class-validator';

export class CreateDossierDto {
  @IsString()
  @IsNotEmpty({ message: 'La référence du dossier est requise' })
  reference_code!: string;

  @IsInt()
  @IsNotEmpty({ message: 'Le type de dossier est requis' })
  dossier_type_id!: number;
s
  @IsInt()
  @IsNotEmpty({ message: 'La division initiale est requise' })
  current_division_id!: number;

  @IsObject()
  @IsNotEmpty({ message: 'Les données du dossier (JSON) sont requises' })
  data!: Record<string, any>;
}