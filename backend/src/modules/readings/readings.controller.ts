import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../../common/errors/api-error.dto';
import { ReadingsService } from './readings.service';
import { CreateExplanationDto, EvaluateReadingDto, GenerateReadingDto } from './dto/readings.dto';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { apiOk, type ApiResponse } from '../../common/types/api-response.type';
import type { Reading } from '../../database/drizzle/types';

@ApiTags('readings')
@ApiBearerAuth('access-token')
@Controller('readings')
export class ReadingsController {
  constructor(private readonly readings: ReadingsService) {}

  @Get('options')
  @ApiOperation({ summary: 'Get generation options (categories, difficulties, cefr)' })
  @ApiOkResponse({ description: 'Available options' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid auth', type: ApiErrorDto })
  async getOptions(): Promise<ApiResponse<Awaited<ReturnType<ReadingsService['getOptions']>>>> {
    return apiOk('Generation options', await this.readings.getOptions());
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a new reading using the active AI provider' })
  @ApiCreatedResponse({ description: 'The newly created reading' })
  @ApiBadRequestResponse({ description: 'Pending limit reached, AI provider failed, or validation error', type: ApiErrorDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid auth', type: ApiErrorDto })
  async generate(
    @CurrentUser() current: AuthUser,
    @Body() dto: GenerateReadingDto,
  ): Promise<ApiResponse<Reading>> {
    const reading = await this.readings.generate({ userId: current.id, options: dto });
    return apiOk('Reading generated successfully', reading);
  }

  @Get('pending')
  @ApiOperation({ summary: 'List the user’s pending readings' })
  @ApiOkResponse({ description: 'Array of pending readings' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid auth', type: ApiErrorDto })
  async listPending(@CurrentUser() current: AuthUser): Promise<ApiResponse<Reading[]>> {
    return apiOk('Pending readings', await this.readings.listPending(current.id));
  }

  @Get('completed')
  @ApiOperation({ summary: 'List the user’s completed readings' })
  @ApiOkResponse({ description: 'Array of completed readings' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid auth', type: ApiErrorDto })
  async listCompleted(@CurrentUser() current: AuthUser): Promise<ApiResponse<Reading[]>> {
    return apiOk('Completed readings', await this.readings.listCompleted(current.id));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a single reading by id' })
  @ApiOkResponse({ description: 'The reading' })
  @ApiNotFoundResponse({ description: 'Reading not found or owned by another user', type: ApiErrorDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid auth', type: ApiErrorDto })
  async findOne(
    @CurrentUser() current: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<Reading>> {
    return apiOk('Reading', await this.readings.findById(id, current.id));
  }

  @Post(':id/evaluate')
  @ApiOperation({ summary: 'Evaluate the user’s summary of a reading' })
  @ApiOkResponse({ description: 'Score + feedback + updated reading' })
  @ApiBadRequestResponse({ description: 'Validation error or reading already evaluated', type: ApiErrorDto })
  @ApiNotFoundResponse({ description: 'Reading not found', type: ApiErrorDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid auth', type: ApiErrorDto })
  async evaluate(
    @CurrentUser() current: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EvaluateReadingDto,
  ): Promise<ApiResponse<{ score: number; passed: boolean; feedback: string; reading: Reading }>> {
    const result = await this.readings.evaluate(id, current.id, dto);
    return apiOk('Evaluation complete', result);
  }

  @Post(':id/explanations')
  @ApiOperation({ summary: 'Explain a word in the context of a reading' })
  @ApiOkResponse({ description: 'Explanation + reading' })
  @ApiBadRequestResponse({ description: 'Validation error', type: ApiErrorDto })
  @ApiNotFoundResponse({ description: 'Reading not found', type: ApiErrorDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid auth', type: ApiErrorDto })
  async explain(
    @CurrentUser() current: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateExplanationDto,
  ): Promise<ApiResponse<{ explanation: string; reading: Reading }>> {
    const result = await this.readings.explain(id, current.id, dto.word, dto.context);
    return apiOk('Explanation', result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a reading' })
  @ApiNotFoundResponse({ description: 'Reading not found', type: ApiErrorDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid auth', type: ApiErrorDto })
  async remove(
    @CurrentUser() current: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<null>> {
    await this.readings.remove(id, current.id);
    return apiOk('Deleted', null);
  }
}

// Re-export to satisfy tsc when reading a partial file
void Query;
