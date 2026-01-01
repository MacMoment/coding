import { IsString, IsOptional, IsNumber, IsEnum, IsArray, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, SubscriptionTier } from '@forgecraft/database';

// User Management DTOs
export class UpdateUserRoleDto {
  @ApiProperty({ enum: ['USER', 'MODERATOR', 'ADMIN'] })
  @IsEnum(UserRole)
  role: UserRole;
}

export class AdjustTokensDto {
  @ApiProperty({ description: 'Amount to add (positive) or deduct (negative)' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'Reason for adjustment' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateUserTierDto {
  @ApiProperty({ enum: ['FREE', 'STARTER', 'PRO', 'ELITE'] })
  @IsEnum(SubscriptionTier)
  tier: SubscriptionTier;
}

// Product/CommunityPost Management DTOs
export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  screenshots?: string[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

// Category/Tag Management DTOs
export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  order?: number;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  order?: number;
}

// Portfolio Management DTOs
export class CreatePortfolioItemDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  @IsOptional()
  gridSize?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  order?: number;
}

export class UpdatePortfolioItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  @IsOptional()
  gridSize?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  order?: number;
}

export class ReorderItemsDto {
  @ApiProperty({ description: 'Array of IDs in the new order' })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
