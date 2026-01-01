import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../common/prisma/prisma.service';
import { AiService } from './ai.service';
import { DocsService } from '../docs/docs.service';
import { TOKEN_COSTS } from '@forgecraft/shared';
import { JobStatus, TransactionType } from '@forgecraft/database';

interface GenerationJobData {
  jobId: string;
  userId: string;
  projectId: string;
  prompt: string;
  model: string;
  platform: string;
  language: string;
  context?: any;
}

@Processor('generation')
export class GenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(GenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly docsService: DocsService,
  ) {
    super();
  }

  async process(job: Job<GenerationJobData>): Promise<void> {
    const { jobId, userId, projectId, prompt, model, platform, language, context } = job.data;

    this.logger.log(`Processing generation job: ${jobId}`);

    try {
      // Update job status to processing
      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.PROCESSING,
          startedAt: new Date(),
        },
      });

      // Get existing files from project
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: { files: true },
      });

      const existingFiles: Record<string, string> = {};
      if (project?.files) {
        for (const file of project.files) {
          if (!file.isDirectory) {
            existingFiles[file.path] = file.content;
          }
        }
      }

      // Search for relevant docs
      let docs: string[] = [];
      try {
        const relevantDocs = await this.docsService.searchForGeneration(prompt, platform);
        docs = relevantDocs.map((d) => d.content);

        // Record doc usage
        for (const doc of relevantDocs) {
          await this.prisma.docUsage.create({
            data: {
              jobId,
              docId: doc.id,
              relevance: doc.relevance,
            },
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to retrieve docs: ${error}`);
      }

      // Generate code
      const result = await this.aiService.generateCode({
        provider: this.getProviderForModel(model),
        model,
        prompt,
        platform,
        language,
        context: {
          existingFiles,
          docs,
          apiVersion: project?.apiVersion || undefined,
          packageName: project?.packageName || undefined,
          commandPrefix: project?.commandPrefix || undefined,
        },
      });

      // Calculate token cost
      const modelKey = model as keyof typeof TOKEN_COSTS.GENERATION;
      const costConfig = TOKEN_COSTS.GENERATION[modelKey];
      const tokenCost = costConfig.base + Math.ceil(result.tokensUsed / 1000) * costConfig.perKToken;

      // Check user balance
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { tokenBalance: true },
      });

      if (!user || user.tokenBalance < tokenCost) {
        throw new Error('Insufficient token balance');
      }

      // Deduct tokens
      await this.prisma.user.update({
        where: { id: userId },
        data: { tokenBalance: { decrement: tokenCost } },
      });

      await this.prisma.tokenTransaction.create({
        data: {
          userId,
          amount: -tokenCost,
          type: TransactionType.GENERATION_COST,
          description: `AI generation (${model})`,
          reference: jobId,
        },
      });

      // Save generated files to project
      for (const [path, content] of Object.entries(result.files)) {
        await this.prisma.projectFile.upsert({
          where: {
            projectId_path: { projectId, path },
          },
          create: {
            projectId,
            path,
            content,
            isDirectory: false,
          },
          update: {
            content,
          },
        });
      }

      // Update project timestamp
      await this.prisma.project.update({
        where: { id: projectId },
        data: { updatedAt: new Date() },
      });

      // Update job as completed
      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.COMPLETED,
          output: {
            files: Object.keys(result.files),
            summary: result.summary,
          },
          tokensUsed: result.tokensUsed,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Generation job completed: ${jobId}`);
    } catch (error) {
      this.logger.error(`Generation job failed: ${jobId}`, error);

      await this.prisma.generationJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  private getProviderForModel(model: string): string {
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
