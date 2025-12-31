import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { AiModule } from '../ai/ai.module';
import { CheckpointsModule } from '../checkpoints/checkpoints.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'generation' }),
    BullModule.registerQueue({ name: 'build' }),
    AiModule,
    CheckpointsModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
