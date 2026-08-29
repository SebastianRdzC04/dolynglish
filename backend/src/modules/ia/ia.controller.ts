import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AIProviderFactory } from './providers/ai-provider.factory';
import { ChatRequestDto } from './dto/chat-request.dto';
import { apiOk, type ApiResponse } from '../../common/types/api-response.type';
import type { ChatMessage } from './providers/ai-provider.interface';

@ApiTags('ia')
@ApiBearerAuth('access-token')
@Controller('ia')
export class IaController {
  constructor(private readonly factory: AIProviderFactory) {}

  @Post('chat')
  @ApiOperation({ summary: 'Send a chat request to the active AI provider' })
  @ApiOkResponse({ description: 'AI response text' })
  async chat(@Body() dto: ChatRequestDto): Promise<ApiResponse<{ text: string }>> {
    const messages: ChatMessage[] = dto.systemPrompt
      ? [{ role: 'system', content: dto.systemPrompt }, ...dto.messages]
      : [...dto.messages];
    const text = await this.factory.getFullResponse(messages);
    return apiOk('AI response', { text });
  }
}
