import { IsOptional, IsString, IsIn, IsUUID } from 'class-validator';

export class QueryDocumentDto {
  @IsOptional()
  @IsIn(['BROUILLON', 'VALIDE', 'ARCHIVE'])
  status?: 'BROUILLON' | 'VALIDE' | 'ARCHIVE';

  @IsOptional()
  @IsUUID()
  category_id?: string;
}