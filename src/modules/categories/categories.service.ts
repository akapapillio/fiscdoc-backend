import { Inject, Injectable, Logger } from '@nestjs/common';
import { type Pool, type RowDataPacket } from 'mysql2/promise';
import { randomUUID } from 'crypto';
import { CreateCategoryDto } from './dto/create-category.dto';

export interface Category extends RowDataPacket {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  children?: Category[];
}

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(@Inject('DATABASE_CONNECTION') private readonly db: Pool) {}

  /**
   * Crée une nouvelle catégorie.
   */
  async create(createCategoryDto: CreateCategoryDto): Promise<any> {
    const id = randomUUID();
    const { code, name, description, parent_id } = createCategoryDto;

    const [result] = await this.db.execute(
      'INSERT INTO `categories` (id, code, name, description, parent_id) VALUES (?, ?, ?, ?, ?)',
      [id, code, name, description || null, parent_id || null],
    );

    this.logger.log(`Catégorie "${name}" créée avec l'ID ${id}.`);
    return { id, ...createCategoryDto };
  }

  /**
   * Récupère toutes les catégories à plat.
   */
  async findAll(): Promise<Category[]> {
    const [rows] = await this.db.query<Category[]>('SELECT * FROM categories ORDER BY name ASC');
    return rows;
  }

  /**
   * Reconstruit l'arborescence complète des catégories.
   */
/**
   * Reconstruit l'arborescence complète des catégories.
   */
  async findTree(): Promise<Category[]> {
    const allCategories = await this.findAll();
    const categoriesMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // 1. On initialise le tableau `children` pour chaque catégorie et on remplit la Map
    allCategories.forEach(category => {
      category.children = [];
      categoriesMap.set(category.id, category);
    });

    // 2. On lie les enfants à leurs parents
    allCategories.forEach(category => {
      if (category.parent_id) {
        const parent = categoriesMap.get(category.parent_id);
        // Utilisation de l'Optional Chaining ?. et du Nullish Coalescing Assignment ??=
        if (parent) {
          parent.children = parent.children ?? [];
          parent.children.push(category);
        } else {
          // Si parent_id pointe vers une catégorie inexistante
          rootCategories.push(category);
        }
      } else {
        // Si pas de parent_id, c'est une catégorie racine
        rootCategories.push(category);
      }
    });

    return rootCategories;
  }
}