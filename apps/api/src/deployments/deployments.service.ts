import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateDeploymentDto, UpdateSecretsDto } from './dto/deployments.dto';
import { DeploymentStatus, Platform, TransactionType } from '@forgecraft/database';
import { TOKEN_COSTS } from '@forgecraft/shared';

@Injectable()
export class DeploymentsService {
  private readonly logger = new Logger(DeploymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('deployment') private readonly deploymentQueue: Queue,
  ) {}

  async deploy(userId: string, dto: CreateDeploymentDto) {
    // Verify project ownership
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      include: { files: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Only Discord bots can be deployed
    if (!project.platform.startsWith('DISCORD_')) {
      throw new BadRequestException('Only Discord bots can be deployed');
    }

    // Check if already deployed
    const existingDeployment = await this.prisma.deployment.findFirst({
      where: {
        projectId: dto.projectId,
        status: { in: [DeploymentStatus.RUNNING, DeploymentStatus.DEPLOYING, DeploymentStatus.BUILDING] },
      },
    });

    if (existingDeployment) {
      throw new BadRequestException('Project is already deployed');
    }

    // Check token balance
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tokenBalance: true },
    });

    if (!user || user.tokenBalance < TOKEN_COSTS.DEPLOY) {
      throw new ForbiddenException('Insufficient token balance');
    }

    // Create deployment record
    const deployment = await this.prisma.deployment.create({
      data: {
        userId,
        projectId: dto.projectId,
        region: dto.region || 'us-east-1',
        secrets: dto.secrets || {},
        status: DeploymentStatus.PENDING,
      },
    });

    // Deduct tokens
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenBalance: { decrement: TOKEN_COSTS.DEPLOY } },
    });

    await this.prisma.tokenTransaction.create({
      data: {
        userId,
        amount: -TOKEN_COSTS.DEPLOY,
        type: TransactionType.DEPLOY_COST,
        description: `Deployment: ${project.name}`,
        reference: deployment.id,
      },
    });

    // Add to deployment queue
    await this.deploymentQueue.add('deploy', {
      deploymentId: deployment.id,
      projectId: dto.projectId,
      platform: project.platform,
      files: project.files,
      secrets: dto.secrets,
    });

    // Add initial log
    await this.addLog(deployment.id, 'INFO', 'Deployment queued');

    return {
      deploymentId: deployment.id,
      status: 'queued',
      message: 'Deployment started',
    };
  }

  async getDeployment(userId: string, deploymentId: string) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        project: {
          select: {
            name: true,
            platform: true,
          },
        },
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 100,
        },
      },
    });

    if (!deployment) {
      throw new NotFoundException('Deployment not found');
    }

    if (deployment.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return deployment;
  }

  async getDeployments(userId: string, projectId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (projectId) {
      where.projectId = projectId;
    }

    const [deployments, total] = await Promise.all([
      this.prisma.deployment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          project: {
            select: {
              name: true,
              platform: true,
            },
          },
        },
      }),
      this.prisma.deployment.count({ where }),
    ]);

    return {
      items: deployments,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async stopDeployment(userId: string, deploymentId: string) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    if (!deployment) {
      throw new NotFoundException('Deployment not found');
    }

    if (deployment.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (deployment.status !== DeploymentStatus.RUNNING) {
      throw new BadRequestException('Deployment is not running');
    }

    // In production, this would stop the actual container
    await this.prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: DeploymentStatus.STOPPED },
    });

    await this.addLog(deploymentId, 'INFO', 'Deployment stopped by user');

    return { message: 'Deployment stopped' };
  }

  async restartDeployment(userId: string, deploymentId: string) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: { project: { include: { files: true } } },
    });

    if (!deployment) {
      throw new NotFoundException('Deployment not found');
    }

    if (deployment.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Update status
    await this.prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: DeploymentStatus.DEPLOYING },
    });

    // Add to deployment queue
    await this.deploymentQueue.add('deploy', {
      deploymentId,
      projectId: deployment.projectId,
      platform: deployment.project.platform,
      files: deployment.project.files,
      secrets: deployment.secrets,
      isRestart: true,
    });

    await this.addLog(deploymentId, 'INFO', 'Deployment restarting');

    return { message: 'Deployment restarting' };
  }

  async updateSecrets(userId: string, deploymentId: string, dto: UpdateSecretsDto) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    if (!deployment) {
      throw new NotFoundException('Deployment not found');
    }

    if (deployment.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Merge with existing secrets (don't expose existing values)
    const updatedSecrets = { ...deployment.secrets as object, ...dto.secrets };

    await this.prisma.deployment.update({
      where: { id: deploymentId },
      data: { secrets: updatedSecrets },
    });

    await this.addLog(deploymentId, 'INFO', 'Secrets updated');

    return { message: 'Secrets updated' };
  }

  async getLogs(userId: string, deploymentId: string, page = 1, limit = 100) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    if (!deployment) {
      throw new NotFoundException('Deployment not found');
    }

    if (deployment.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.deploymentLog.findMany({
        where: { deploymentId },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.deploymentLog.count({ where: { deploymentId } }),
    ]);

    return {
      items: logs,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async addLog(deploymentId: string, level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR', message: string) {
    await this.prisma.deploymentLog.create({
      data: {
        deploymentId,
        level: level as any,
        message,
      },
    });
  }

  async updateStatus(deploymentId: string, status: DeploymentStatus, containerId?: string, publicUrl?: string) {
    await this.prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status,
        containerId,
        publicUrl,
        lastHeartbeat: status === DeploymentStatus.RUNNING ? new Date() : undefined,
      },
    });
  }

  async deleteDeployment(userId: string, deploymentId: string) {
    const deployment = await this.prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    if (!deployment) {
      throw new NotFoundException('Deployment not found');
    }

    if (deployment.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Stop if running
    if (deployment.status === DeploymentStatus.RUNNING) {
      // In production, stop the container here
    }

    await this.prisma.deployment.delete({
      where: { id: deploymentId },
    });

    return { message: 'Deployment deleted' };
  }
}
