import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../common/prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CheckpointsService } from '../checkpoints/checkpoints.service';
import { UsersService } from '../users/users.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  GenerateCodeDto,
  UpdateFileDto,
  CreateFileDto,
} from './dto/projects.dto';
import { TOKEN_COSTS } from '@forgecraft/shared';
import { TransactionType, JobStatus, Platform, Language } from '@forgecraft/database';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly checkpointsService: CheckpointsService,
    @InjectQueue('generation') private readonly generationQueue: Queue,
    @InjectQueue('build') private readonly buildQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        platform: dto.platform as Platform,
        language: dto.language as Language,
        template: dto.template,
        apiVersion: dto.apiVersion,
        packageName: dto.packageName,
        commandPrefix: dto.commandPrefix,
        config: dto.config || {},
      },
      include: {
        files: true,
      },
    });

    return project;
  }

  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              files: true,
              checkpoints: true,
            },
          },
        },
      }),
      this.prisma.project.count({ where: { userId } }),
    ]);

    return {
      items: projects,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        files: {
          orderBy: { path: 'asc' },
        },
        checkpoints: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            generationJobs: true,
            deployments: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId && !project.isPublic) {
      throw new ForbiddenException('Access denied');
    }

    return project;
  }

  async update(userId: string, projectId: string, dto: UpdateProjectDto) {
    const project = await this.findOne(userId, projectId);

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });
  }

  async delete(userId: string, projectId: string) {
    const project = await this.findOne(userId, projectId);

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.project.delete({
      where: { id: projectId },
    });

    return { message: 'Project deleted' };
  }

  async generateCode(userId: string, projectId: string, dto: GenerateCodeDto) {
    const project = await this.findOne(userId, projectId);

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Create generation job
    const job = await this.prisma.generationJob.create({
      data: {
        userId,
        projectId,
        prompt: dto.prompt,
        model: dto.model as any,
        provider: this.getProviderForModel(dto.model),
        context: dto.context || {},
        status: JobStatus.PENDING,
      },
    });

    // Add to queue
    await this.generationQueue.add('generate', {
      jobId: job.id,
      userId,
      projectId,
      prompt: dto.prompt,
      model: dto.model,
      platform: project.platform,
      language: project.language,
      context: dto.context,
    });

    return {
      jobId: job.id,
      status: 'queued',
      message: 'Generation job queued',
    };
  }

  async getGenerationJob(userId: string, projectId: string, jobId: string) {
    const job = await this.prisma.generationJob.findUnique({
      where: { id: jobId },
      include: {
        docsUsed: {
          include: {
            doc: {
              select: {
                title: true,
                platform: true,
                version: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return job;
  }

  async updateFile(userId: string, projectId: string, fileId: string, dto: UpdateFileDto) {
    const project = await this.findOne(userId, projectId);

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const file = await this.prisma.projectFile.findUnique({
      where: { id: fileId },
    });

    if (!file || file.projectId !== projectId) {
      throw new NotFoundException('File not found');
    }

    return this.prisma.projectFile.update({
      where: { id: fileId },
      data: { content: dto.content },
    });
  }

  async createFile(userId: string, projectId: string, dto: CreateFileDto) {
    const project = await this.findOne(userId, projectId);

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Check if file already exists
    const existing = await this.prisma.projectFile.findUnique({
      where: {
        projectId_path: {
          projectId,
          path: dto.path,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('File already exists');
    }

    return this.prisma.projectFile.create({
      data: {
        projectId,
        path: dto.path,
        content: dto.content || '',
        isDirectory: dto.isDirectory || false,
      },
    });
  }

  async deleteFile(userId: string, projectId: string, fileId: string) {
    const project = await this.findOne(userId, projectId);

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const file = await this.prisma.projectFile.findUnique({
      where: { id: fileId },
    });

    if (!file || file.projectId !== projectId) {
      throw new NotFoundException('File not found');
    }

    await this.prisma.projectFile.delete({
      where: { id: fileId },
    });

    return { message: 'File deleted' };
  }

  async renameFile(userId: string, projectId: string, fileId: string, newPath: string) {
    const project = await this.findOne(userId, projectId);

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const file = await this.prisma.projectFile.findUnique({
      where: { id: fileId },
    });

    if (!file || file.projectId !== projectId) {
      throw new NotFoundException('File not found');
    }

    return this.prisma.projectFile.update({
      where: { id: fileId },
      data: { path: newPath },
    });
  }

  async buildProject(userId: string, projectId: string) {
    const project = await this.findOne(userId, projectId);

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Add to build queue
    const buildJob = await this.buildQueue.add('build', {
      userId,
      projectId,
      platform: project.platform,
      files: project.files,
    });

    return {
      buildId: buildJob.id,
      status: 'queued',
      message: 'Build job queued',
    };
  }

  private getProviderForModel(model: string): any {
    const modelProviders: Record<string, string> = {
      CLAUDE_SONNET_4_5: 'ANTHROPIC',
      CLAUDE_OPUS_4_5: 'ANTHROPIC',
      GPT_5: 'OPENAI',
      GEMINI_3_PRO: 'GOOGLE',
      GROK_4_1_FAST: 'XAI',
    };
    return modelProviders[model] || 'ANTHROPIC';
  }
}
