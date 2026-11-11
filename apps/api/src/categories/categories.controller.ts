import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  categoryIdParamSchema,
  type Category,
  type CategoryIdParamDto,
  type CategoryWithAttributes,
} from '@app/contracts';
import { Authenticate, Public } from '@nestjs/authentication';
import { AdminGuard } from '../common/guards/admin.guard';
import { CategoriesService } from './categories.service';

@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  async getAllCategories(): Promise<Category[]> {
    return await this.categoriesService.getAllCategories();
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  async getCategory(
    @Param({ schema: categoryIdParamSchema }) { id }: CategoryIdParamDto,
  ): Promise<CategoryWithAttributes> {
    const category = await this.categoriesService.getCategory(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  @Delete(':id')
  @Authenticate()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCategory(
    @Param({ schema: categoryIdParamSchema }) { id }: CategoryIdParamDto,
  ): Promise<void> {
    await this.categoriesService.deleteCategory(id);
  }
}
