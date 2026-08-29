import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export type ChatRole = 'system' | 'user' | 'assistant';

export class ChatMessageDto {
  @IsEnum(['system', 'user', 'assistant'])
  role!: ChatRole;

  @IsString()
  @MinLength(1)
  @MaxLength(32000)
  content!: string;
}
