import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiService } from './ai.service';
import { GenerationProcessor } from './generation.processor';
import { DocsModule } from '../docs/docs.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'generation' }),
    DocsModule,
  ],
  providers: [AiService, GenerationProcessor],
  exports: [AiService],
})
export class AiModule {}
