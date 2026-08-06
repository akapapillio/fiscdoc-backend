import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/common/database/database.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [DatabaseModule , ApiKeysModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}