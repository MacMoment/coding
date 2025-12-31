import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PublishProjectDto, CreateCommentDto, ReportDto } from './dto/community.dto';
import { ReportStatus } from '@forgecraft/database';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async getGallery(page = 1, limit = 20, filters?: {
    platform?: string;
    tags?: string[];
    featured?: boolean;
    search?: string;
    sort?: 'downloads' | 'likes' | 'recent';
  }) {
    const skip = (page - 1) * limit;

    const where: any = {
      isPublished: true,
    };

    if (filters?.platform) {
      where.project = { platform: filters.platform };
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters?.featured) {
      where.isFeatured = true;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    switch (filters?.sort) {
      case 'downloads':
        orderBy.downloads = 'desc';
        break;
      case 'likes':
        orderBy.likesCount = 'desc';
        break;
      case 'recent':
      default:
        orderBy.createdAt = 'desc';
    }

    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              avatar: true,
            },
          },
          project: {
            select: {
              platform: true,
              language: true,
            },
          },
          _count: {
            select: {
              comments: true,
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

  async getPost(postId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
        project: {
          select: {
            id: true,
            platform: true,
            language: true,
            files: {
              select: {
                path: true,
                isDirectory: true,
              },
            },
          },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!post || !post.isPublished) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async publish(userId: string, dto: PublishProjectDto) {
    // Verify project ownership
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Check if already published
    const existing = await this.prisma.communityPost.findUnique({
      where: { projectId: dto.projectId },
    });

    if (existing) {
      // Update existing post
      return this.prisma.communityPost.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          description: dto.description,
          tags: dto.tags,
          screenshots: dto.screenshots || [],
          version: dto.version || '1.0.0',
          license: dto.license || 'MIT',
          isPublished: true,
        },
      });
    }

    // Create new post
    return this.prisma.communityPost.create({
      data: {
        userId,
        projectId: dto.projectId,
        name: dto.name,
        description: dto.description,
        tags: dto.tags,
        screenshots: dto.screenshots || [],
        version: dto.version || '1.0.0',
        license: dto.license || 'MIT',
        isPublished: true,
      },
    });
  }

  async unpublish(userId: string, postId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.communityPost.update({
      where: { id: postId },
      data: { isPublished: false },
    });
  }

  async likePost(userId: string, postId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post || !post.isPublished) {
      throw new NotFoundException('Post not found');
    }

    // Check if already liked
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existingLike) {
      // Unlike
      await this.prisma.like.delete({
        where: { id: existingLike.id },
      });

      await this.prisma.communityPost.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      });

      return { liked: false };
    }

    // Like
    await this.prisma.like.create({
      data: { userId, postId },
    });

    await this.prisma.communityPost.update({
      where: { id: postId },
      data: { likesCount: { increment: 1 } },
    });

    return { liked: true };
  }

  async hasLiked(userId: string, postId: string) {
    const like = await this.prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });
    return !!like;
  }

  async addComment(userId: string, postId: string, dto: CreateCommentDto) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post || !post.isPublished) {
      throw new NotFoundException('Post not found');
    }

    return this.prisma.comment.create({
      data: {
        userId,
        postId,
        content: dto.content,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        post: {
          select: { userId: true },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Allow deletion by comment author or post owner
    if (comment.userId !== userId && comment.post.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    return { message: 'Comment deleted' };
  }

  async reportPost(userId: string, postId: string, dto: ReportDto) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if already reported by this user
    const existingReport = await this.prisma.report.findFirst({
      where: {
        userId,
        postId,
        status: ReportStatus.PENDING,
      },
    });

    if (existingReport) {
      throw new BadRequestException('You have already reported this post');
    }

    return this.prisma.report.create({
      data: {
        userId,
        postId,
        reason: dto.reason,
        details: dto.details,
      },
    });
  }

  async downloadProject(postId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      include: {
        project: {
          include: {
            files: true,
          },
        },
      },
    });

    if (!post || !post.isPublished) {
      throw new NotFoundException('Post not found');
    }

    // Increment download count
    await this.prisma.communityPost.update({
      where: { id: postId },
      data: { downloads: { increment: 1 } },
    });

    // Return files
    const files: Record<string, string> = {};
    for (const file of post.project.files) {
      if (!file.isDirectory) {
        files[file.path] = file.content;
      }
    }

    return {
      name: post.name,
      version: post.version,
      files,
    };
  }

  // Admin functions
  async featurePost(postId: string, featured: boolean) {
    return this.prisma.communityPost.update({
      where: { id: postId },
      data: { isFeatured: featured },
    });
  }

  async moderatePost(postId: string, action: 'approve' | 'remove') {
    if (action === 'remove') {
      return this.prisma.communityPost.update({
        where: { id: postId },
        data: { isPublished: false },
      });
    }
    return this.prisma.communityPost.findUnique({ where: { id: postId } });
  }

  async getPendingReports(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where: { status: ReportStatus.PENDING },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              displayName: true,
            },
          },
          post: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.report.count({ where: { status: ReportStatus.PENDING } }),
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
    return this.prisma.report.update({
      where: { id: reportId },
      data: { status: status as ReportStatus },
    });
  }
}
