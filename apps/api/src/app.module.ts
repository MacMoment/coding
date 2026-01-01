import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { BillingModule } from './billing/billing.module';
import { CommunityModule } from './community/community.module';
import { DocsModule } from './docs/docs.module';
import { AiModule } from './ai/ai.module';
import { CheckpointsModule } from './checkpoints/checkpoints.module';
import { DeploymentsModule } from './deployments/deployments.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { StorageModule } from './common/storage/storage.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Job queue
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),

    // Database
    PrismaModule,

    // Storage
    StorageModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ProjectsModule,
    BillingModule,
    CommunityModule,
    DocsModule,
    AiModule,
    CheckpointsModule,
    DeploymentsModule,
  ],
})
export class AppModule {}
