import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { TOKEN_COSTS } from '@forgecraft/shared';
import { TransactionType } from '@forgecraft/database';

@Injectable()
export class CheckpointsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(userId: string, projectId: string, summary: string, skipTokenCharge = false) {
    // Verify project ownership
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { files: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Check token balance (skip for auto-backups)
    if (!skipTokenCharge) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { tokenBalance: true },
      });

      if (!user || user.tokenBalance < TOKEN_COSTS.CHECKPOINT) {
        throw new ForbiddenException('Insufficient token balance');
      }
    }

    // Create snapshot
    const files: Record<string, string> = {};
    for (const file of project.files) {
      if (!file.isDirectory) {
        files[file.path] = file.content;
      }
    }

    // Generate checkpoint ID
    const checkpointId = `cp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Upload snapshot to S3
    const snapshotUrl = await this.storageService.uploadProjectSnapshot(
      userId,
      projectId,
      checkpointId,
      files,
    );

    // Create checkpoint record
    const checkpoint = await this.prisma.checkpoint.create({
      data: {
        userId,
        projectId,
        summary,
        snapshotUrl,
      },
    });

    // Deduct tokens (skip for auto-backups)
    if (!skipTokenCharge) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { tokenBalance: { decrement: TOKEN_COSTS.CHECKPOINT } },
      });

      await this.prisma.tokenTransaction.create({
        data: {
          userId,
          amount: -TOKEN_COSTS.CHECKPOINT,
          type: TransactionType.CHECKPOINT_COST,
          description: `Checkpoint created: ${summary}`,
          reference: checkpoint.id,
        },
      });
    }

    return checkpoint;
  }

  async findByProject(userId: string, projectId: string, page = 1, limit = 20) {
    // Verify project access
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId && !project.isPublic) {
      throw new ForbiddenException('Access denied');
    }

    const skip = (page - 1) * limit;

    const [checkpoints, total] = await Promise.all([
      this.prisma.checkpoint.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.checkpoint.count({ where: { projectId } }),
    ]);

    return {
      items: checkpoints,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, checkpointId: string) {
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { id: checkpointId },
      include: {
        project: {
          select: {
            userId: true,
            isPublic: true,
          },
        },
      },
    });

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    if (checkpoint.project.userId !== userId && !checkpoint.project.isPublic) {
      throw new ForbiddenException('Access denied');
    }

    return checkpoint;
  }

  async restore(userId: string, projectId: string, checkpointId: string) {
    // Verify project ownership
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Get checkpoint
    const checkpoint = await this.prisma.checkpoint.findUnique({
      where: { id: checkpointId },
    });

    if (!checkpoint || checkpoint.projectId !== projectId) {
      throw new NotFoundException('Checkpoint not found');
    }

    // Create a backup checkpoint before restore (skip token charge to prevent abuse)
    await this.create(userId, projectId, 'Auto-backup before restore', true);

    // Get snapshot from S3
    const files = await this.storageService.getProjectSnapshot(checkpoint.snapshotUrl);

    // Delete current files
    await this.prisma.projectFile.deleteMany({
      where: { projectId },
    });

    // Restore files from snapshot
    for (const [path, content] of Object.entries(files)) {
      await this.prisma.projectFile.create({
        data: {
          projectId,
          path,
          content,
          isDirectory: false,
        },
      });
    }

    // Update project timestamp
    await this.prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    return {
      message: 'Project restored to checkpoint',
      checkpointId,
      filesRestored: Object.keys(files).length,
    };
  }

  async getSnapshot(userId: string, checkpointId: string) {
    const checkpoint = await this.findOne(userId, checkpointId);
    return this.storageService.getProjectSnapshot(checkpoint.snapshotUrl);
  }
}
