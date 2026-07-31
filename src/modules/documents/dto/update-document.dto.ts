import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DocumentStatus } from '../enums/document-status.enum';

export class UpdateDocumentDto {
 
  @IsString()
  @MaxLength(191)
  @IsOptional()
  title?: string; // Rendu optionnel pour les mises à jour partielles

  @IsString()
  @MaxLength(191)
  @IsOptional()
  category_id?: string; // Rendu optionnel

  @IsString()    
  @IsOptional()
  html_content?: string;

  @IsOptional()
  @IsEnum(DocumentStatus) // Validation pour le statut
  status?: DocumentStatus;
}