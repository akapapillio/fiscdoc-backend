import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum DocumentStatus {
  BROUILLON = 'BROUILLON',
  VALIDE = 'VALIDE',
  ARCHIVE = 'ARCHIVE',
}

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  title!: string;

  @IsString()      // <-- On remplace @IsUUID() par @IsString()
  @IsNotEmpty()
  category_id!: string;

  @IsString()
  @IsNotEmpty()
  html_content!: string;
}