import { Module } from '@nestjs/common';
import { databaseProvider , databaseProvider2} from './database.provider';

@Module({
  providers: [databaseProvider, databaseProvider2],
  exports: [databaseProvider , databaseProvider2],
  
})
export class DatabaseModule {}