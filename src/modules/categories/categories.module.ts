import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { DatabaseModule } from '../../common/database/database.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [
    DatabaseModule, 
    ApiKeysModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}