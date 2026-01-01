import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UserRole, SubscriptionTier, TransactionType } from '@forgecraft/database';
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

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // DASHBOARD STATISTICS
  // ============================================

  async getDashboardStats() {
    const [
      totalUsers,
      totalProjects,
      totalPosts,
      totalTokensUsed,
      recentUsers,
      usersByTier,
      usersByRole,
      postsThisMonth,
      projectsByPlatform,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.project.count(),
      this.prisma.communityPost.count(),
      this.prisma.tokenTransaction.aggregate({
        where: { amount: { lt: 0 } },
        _sum: { amount: true },
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.user.groupBy({
        by: ['subscriptionTier'],
        _count: true,
      }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      this.prisma.communityPost.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(1)),
          },
        },
      }),
      this.prisma.project.groupBy({
        by: ['platform'],
        _count: true,
      }),
    ]);

    // Get recent activity for graphs
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const userGrowth = await this.prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
    });

    return {
      totals: {
        users: totalUsers,
        projects: totalProjects,
        posts: totalPosts,
        tokensUsed: Math.abs(totalTokensUsed._sum.amount || 0),
      },
      recentActivity: {
        newUsersThisWeek: recentUsers,
        postsThisMonth,
      },
      distributions: {
        usersByTier: usersByTier.map((t) => ({
          tier: t.subscriptionTier,
          count: t._count,
        })),
        usersByRole: usersByRole.map((r) => ({
          role: r.role,
          count: r._count,
        })),
        projectsByPlatform: projectsByPlatform.map((p) => ({
          platform: p.platform,
          count: p._count,
        })),
      },
    };
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  async getUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatar: true,
          role: true,
          subscriptionTier: true,
          tokenBalance: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projects: true,
              communityPosts: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatar: true,
        role: true,
        subscriptionTier: true,
        tokenBalance: true,
        emailVerified: true,
        referralCode: true,
        referredBy: true,
        lastDailyClaim: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: true,
            communityPosts: true,
            tokenTransactions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserRole(userId: string, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
      },
    });
  }

  async adjustUserTokens(userId: string, dto: AdjustTokensDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.tokenBalance + dto.amount < 0) {
      throw new BadRequestException('Insufficient token balance for deduction');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenBalance: { increment: dto.amount } },
    });

    await this.prisma.tokenTransaction.create({
      data: {
        userId,
        amount: dto.amount,
        type: TransactionType.ADMIN_ADJUSTMENT,
        description: dto.reason || `Admin adjustment: ${dto.amount > 0 ? '+' : ''}${dto.amount} tokens`,
      },
    });

    return {
      newBalance: user.tokenBalance + dto.amount,
      adjustment: dto.amount,
    };
  }

  async updateUserTier(userId: string, dto: UpdateUserTierDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: dto.tier },
      select: {
        id: true,
        email: true,
        displayName: true,
        subscriptionTier: true,
      },
    });
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent deleting admins
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot delete admin users');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }

  // ============================================
  // PRODUCT/POST MANAGEMENT
  // ============================================

  async getProducts(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          project: {
            select: {
              platform: true,
            },
          },
        },
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    return {
      items: posts,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateProduct(productId: string, dto: UpdateProductDto) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: productId },
    });

    if (!post) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.communityPost.update({
      where: { id: productId },
      data: dto,
    });
  }

  async deleteProduct(productId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: productId },
    });

    if (!post) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.communityPost.delete({
      where: { id: productId },
    });

    return { message: 'Product deleted successfully' };
  }

  // ============================================
  // CATEGORY MANAGEMENT
  // ============================================

  async getCategories() {
    return this.prisma.category.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Category with this name already exists');
    }

    // Get the highest order if not specified
    if (dto.order === undefined) {
      const lastCategory = await this.prisma.category.findFirst({
        orderBy: { order: 'desc' },
      });
      dto.order = (lastCategory?.order || 0) + 1;
    }

    return this.prisma.category.create({
      data: dto,
    });
  }

  async updateCategory(categoryId: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.name && dto.name !== category.name) {
      const existing = await this.prisma.category.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw new BadRequestException('Category with this name already exists');
      }
    }

    return this.prisma.category.update({
      where: { id: categoryId },
      data: dto,
    });
  }

  async deleteCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.prisma.category.delete({
      where: { id: categoryId },
    });

    return { message: 'Category deleted successfully' };
  }

  async reorderCategories(dto: ReorderItemsDto) {
    const updates = dto.ids.map((id, index) =>
      this.prisma.category.update({
        where: { id },
        data: { order: index },
      })
    );

    await Promise.all(updates);

    return this.getCategories();
  }

  // ============================================
  // PORTFOLIO MANAGEMENT
  // ============================================

  async getPortfolioItems() {
    return this.prisma.portfolioItem.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async createPortfolioItem(dto: CreatePortfolioItemDto) {
    // Get the highest order if not specified
    if (dto.order === undefined) {
      const lastItem = await this.prisma.portfolioItem.findFirst({
        orderBy: { order: 'desc' },
      });
      dto.order = (lastItem?.order || 0) + 1;
    }

    return this.prisma.portfolioItem.create({
      data: dto,
    });
  }

  async updatePortfolioItem(itemId: string, dto: UpdatePortfolioItemDto) {
    const item = await this.prisma.portfolioItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Portfolio item not found');
    }

    return this.prisma.portfolioItem.update({
      where: { id: itemId },
      data: dto,
    });
  }

  async deletePortfolioItem(itemId: string) {
    const item = await this.prisma.portfolioItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Portfolio item not found');
    }

    await this.prisma.portfolioItem.delete({
      where: { id: itemId },
    });

    return { message: 'Portfolio item deleted successfully' };
  }

  async reorderPortfolioItems(dto: ReorderItemsDto) {
    const updates = dto.ids.map((id, index) =>
      this.prisma.portfolioItem.update({
        where: { id },
        data: { order: index },
      })
    );

    await Promise.all(updates);

    return this.getPortfolioItems();
  }

  // ============================================
  // REPORTS MANAGEMENT
  // ============================================

  async getPendingReports(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
          post: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      items: reports,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async resolveReport(reportId: string, status: 'RESOLVED' | 'DISMISSED') {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return this.prisma.report.update({
      where: { id: reportId },
      data: { status },
    });
  }
}
