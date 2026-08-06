import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { DocumentStatus } from '../enums/document-status.enum';

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

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;
}