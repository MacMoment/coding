import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateProfileDto } from './dto/users.dto';
import { PRICING_TIERS, TOKEN_COSTS } from '@forgecraft/shared';
import { TransactionType, SubscriptionTier } from '@forgecraft/database';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });

    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  async getTokenBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tokenBalance: true, subscriptionTier: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      balance: user.tokenBalance,
      tier: user.subscriptionTier,
    };
  }

  async getTokenHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.tokenTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tokenTransaction.count({ where: { userId } }),
    ]);

    return {
      items: transactions,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async claimDailyTokens(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already claimed today
    const now = new Date();
    if (user.lastDailyClaim) {
      const lastClaim = new Date(user.lastDailyClaim);
      const timeDiff = now.getTime() - lastClaim.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        const nextClaimTime = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
        throw new BadRequestException({
          message: 'Daily tokens already claimed',
          nextClaimAt: nextClaimTime.toISOString(),
        });
      }
    }

    // Get tokens based on tier
    const tierKey = user.subscriptionTier as keyof typeof PRICING_TIERS;
    const tierConfig = PRICING_TIERS[tierKey];
    const tokensToAdd = tierConfig.dailyClaimTokens;

    // Update user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        tokenBalance: { increment: tokensToAdd },
        lastDailyClaim: now,
      },
    });

    // Create transaction
    await this.prisma.tokenTransaction.create({
      data: {
        userId,
        amount: tokensToAdd,
        type: TransactionType.DAILY_CLAIM,
        description: `Daily token claim (${user.subscriptionTier} tier)`,
      },
    });

    return {
      tokensAdded: tokensToAdd,
      newBalance: user.tokenBalance + tokensToAdd,
      nextClaimAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async addTokens(userId: string, amount: number, description: string, type: TransactionType = TransactionType.ADMIN_ADJUSTMENT) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenBalance: { increment: amount } },
    });

    await this.prisma.tokenTransaction.create({
      data: {
        userId,
        amount,
        type,
        description,
      },
    });
  }

  async deductTokens(userId: string, amount: number, description: string, type: TransactionType) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.tokenBalance < amount) {
      throw new BadRequestException('Insufficient token balance');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenBalance: { decrement: amount } },
    });

    await this.prisma.tokenTransaction.create({
      data: {
        userId,
        amount: -amount,
        type,
        description,
      },
    });
  }

  async canUseModel(userId: string, model: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    if (!user) {
      return false;
    }

    const tierKey = user.subscriptionTier as keyof typeof PRICING_TIERS;
    const tierConfig = PRICING_TIERS[tierKey];
    return tierConfig.allowedModels.includes(model as any);
  }

  async updateSubscriptionTier(userId: string, tier: SubscriptionTier) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: tier },
    });
  }

  async refillSubscriptionTokens(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    if (!user) {
      return;
    }

    const tierKey = user.subscriptionTier as keyof typeof PRICING_TIERS;
    const tierConfig = PRICING_TIERS[tierKey];

    await this.addTokens(
      userId,
      tierConfig.tokensPerMonth,
      `Monthly token refill (${user.subscriptionTier} tier)`,
      TransactionType.SUBSCRIPTION_REFILL,
    );
  }
}
