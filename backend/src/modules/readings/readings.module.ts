import { Module } from '@nestjs/common';
import { ReadingsController } from './readings.controller';
import { ReadingsService } from './readings.service';
import { PromptGeneratorService } from './prompt-generator.service';
import { AiResponseParserService } from './ai-response-parser.service';
import { PromptLogService } from './prompt-log.service';
import { UsersModule } from '../users/users.module';
import { IaModule } from '../ia/ia.module';

@Module({
  imports: [UsersModule, IaModule],
  controllers: [ReadingsController],
  providers: [ReadingsService, PromptGeneratorService, AiResponseParserService, PromptLogService],
  exports: [PromptLogService, PromptGeneratorService, AiResponseParserService],
})
export class ReadingsModule {}
