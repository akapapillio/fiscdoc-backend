import { Controller, Get, Post, Body, UseGuards, ValidationPipe } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@UseGuards(ApiKeyGuard) // Sécurise toutes les routes de ce contrôleur
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body(new ValidationPipe()) createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  /**
   * Récupère la liste de toutes les catégories à plat.
   */
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  /**
   * Récupère les catégories sous forme d'arbre hiérarchique.
   */
  @Get('tree')
  findTree() {
    return this.categoriesService.findTree();
  }
}