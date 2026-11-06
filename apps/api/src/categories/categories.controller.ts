import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import {
  categoryIdParamSchema,
  type Category,
  type CategoryIdParamDto,
  type CategoryWithAttributes,
} from '@app/contracts';
import { Public } from '@nestjs/authentication';
import { CategoriesService } from './categories.service';

@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getAllCategories(): Promise<Category[]> {
    return await this.categoriesService.getAllCategories();
  }

  @Get(':id')
  async getCategory(
    @Param({ schema: categoryIdParamSchema }) { id }: CategoryIdParamDto,
  ): Promise<CategoryWithAttributes> {
    const category = await this.categoriesService.getCategory(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }
}
