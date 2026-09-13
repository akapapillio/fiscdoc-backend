import { IsString, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class TransferDossierDto {
  @IsInt()
  @IsNotEmpty({ message: 'La division de destination est requise' })
  destination_division_id!: number;

  @IsString()
  @IsNotEmpty({ message: 'Le nouveau statut est requis' })
  new_status!: string;

  @IsString()
  @IsOptional()
  comment?: string;
}