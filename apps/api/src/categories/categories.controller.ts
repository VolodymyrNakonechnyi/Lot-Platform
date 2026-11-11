import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  categoryIdParamSchema,
  type CreateCategoryDto,
  createCategorySchema,
  type Category,
  type CategoryIdParamDto,
  type CategoryWithAttributes,
  type UpdateCategoryDto,
  updateCategorySchema,
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

  @Post()
  @Authenticate()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createCategory(
    @Body({ schema: createCategorySchema }) body: CreateCategoryDto,
  ): Promise<CreateCategoryDto> {
    return await this.categoriesService.createCategory(body);
  }

  @Put(':id')
  @Authenticate()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async updateCategory(
    @Param({ schema: categoryIdParamSchema }) { id }: CategoryIdParamDto,
    @Body({ schema: updateCategorySchema }) body: UpdateCategoryDto,
  ) {
    return await this.categoriesService.updateCategory(id, body);
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
