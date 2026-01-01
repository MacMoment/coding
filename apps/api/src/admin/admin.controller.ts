import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import {
  UpdateUserRoleDto,
  AdjustTokensDto,
  UpdateUserTierDto,
  UpdateProductDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreatePortfolioItemDto,
  UpdatePortfolioItemDto,
  ReorderItemsDto,
} from './dto/admin.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============================================
  // DASHBOARD
  // ============================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  @Get('users')
  @ApiOperation({ summary: 'List all users with pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of users' })
  async getUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(page, limit, search);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user details' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserDetails(@Param('userId') userId: string) {
    return this.adminService.getUserDetails(userId);
  }

  @Put('users/:userId/role')
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({ status: 200, description: 'User role updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(userId, dto);
  }

  @Post('users/:userId/tokens')
  @ApiOperation({ summary: 'Adjust user token balance' })
  @ApiResponse({ status: 200, description: 'Tokens adjusted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async adjustUserTokens(
    @Param('userId') userId: string,
    @Body() dto: AdjustTokensDto,
  ) {
    return this.adminService.adjustUserTokens(userId, dto);
  }

  @Put('users/:userId/tier')
  @ApiOperation({ summary: 'Update user subscription tier' })
  @ApiResponse({ status: 200, description: 'User tier updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserTier(
    @Param('userId') userId: string,
    @Body() dto: UpdateUserTierDto,
  ) {
    return this.adminService.updateUserTier(userId, dto);
  }

  @Delete('users/:userId')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete admin users or yourself' })
  async deleteUser(@Param('userId') userId: string, @Request() req: any) {
    return this.adminService.deleteUser(userId, req.user.id);
  }

  // ============================================
  // PRODUCT MANAGEMENT
  // ============================================

  @Get('products')
  @ApiOperation({ summary: 'List all products/community posts' })
  @ApiResponse({ status: 200, description: 'Paginated list of products' })
  async getProducts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
  ) {
    return this.adminService.getProducts(page, limit, search);
  }

  @Put('products/:productId')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.adminService.updateProduct(productId, dto);
  }

  @Delete('products/:productId')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProduct(@Param('productId') productId: string) {
    return this.adminService.deleteProduct(productId);
  }

  // ============================================
  // CATEGORY MANAGEMENT
  // ============================================

  @Get('categories')
  @ApiOperation({ summary: 'List all categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async getCategories() {
    return this.adminService.getCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  @ApiResponse({ status: 400, description: 'Category name already exists' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminService.createCategory(dto);
  }

  @Put('categories/:categoryId')
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.adminService.updateCategory(categoryId, dto);
  }

  @Delete('categories/:categoryId')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Category deleted' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async deleteCategory(@Param('categoryId') categoryId: string) {
    return this.adminService.deleteCategory(categoryId);
  }

  @Post('categories/reorder')
  @ApiOperation({ summary: 'Reorder categories' })
  @ApiResponse({ status: 200, description: 'Categories reordered' })
  async reorderCategories(@Body() dto: ReorderItemsDto) {
    return this.adminService.reorderCategories(dto);
  }

  // ============================================
  // PORTFOLIO MANAGEMENT
  // ============================================

  @Get('portfolio')
  @ApiOperation({ summary: 'List all portfolio items' })
  @ApiResponse({ status: 200, description: 'List of portfolio items' })
  async getPortfolioItems() {
    return this.adminService.getPortfolioItems();
  }

  @Post('portfolio')
  @ApiOperation({ summary: 'Create a new portfolio item' })
  @ApiResponse({ status: 201, description: 'Portfolio item created' })
  async createPortfolioItem(@Body() dto: CreatePortfolioItemDto) {
    return this.adminService.createPortfolioItem(dto);
  }

  @Put('portfolio/:itemId')
  @ApiOperation({ summary: 'Update a portfolio item' })
  @ApiResponse({ status: 200, description: 'Portfolio item updated' })
  @ApiResponse({ status: 404, description: 'Portfolio item not found' })
  async updatePortfolioItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdatePortfolioItemDto,
  ) {
    return this.adminService.updatePortfolioItem(itemId, dto);
  }

  @Delete('portfolio/:itemId')
  @ApiOperation({ summary: 'Delete a portfolio item' })
  @ApiResponse({ status: 200, description: 'Portfolio item deleted' })
  @ApiResponse({ status: 404, description: 'Portfolio item not found' })
  async deletePortfolioItem(@Param('itemId') itemId: string) {
    return this.adminService.deletePortfolioItem(itemId);
  }

  @Post('portfolio/reorder')
  @ApiOperation({ summary: 'Reorder portfolio items' })
  @ApiResponse({ status: 200, description: 'Portfolio items reordered' })
  async reorderPortfolioItems(@Body() dto: ReorderItemsDto) {
    return this.adminService.reorderPortfolioItems(dto);
  }

  // ============================================
  // REPORTS MANAGEMENT
  // ============================================

  @Get('reports')
  @ApiOperation({ summary: 'Get pending reports' })
  @ApiResponse({ status: 200, description: 'Paginated list of pending reports' })
  async getPendingReports(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.adminService.getPendingReports(page, limit);
  }

  @Put('reports/:reportId')
  @ApiOperation({ summary: 'Resolve a report' })
  @ApiResponse({ status: 200, description: 'Report resolved' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async resolveReport(
    @Param('reportId') reportId: string,
    @Body() body: { status: 'RESOLVED' | 'DISMISSED' },
  ) {
    return this.adminService.resolveReport(reportId, body.status);
  }
}
