import { IsString, IsOptional, IsBoolean, IsIn, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'My Awesome Plugin' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'A plugin that does amazing things' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: ['MINECRAFT_SPIGOT', 'MINECRAFT_PAPER', 'MINECRAFT_FABRIC', 'MINECRAFT_FORGE', 'DISCORD_NODE', 'DISCORD_PYTHON'],
  })
  @IsIn(['MINECRAFT_SPIGOT', 'MINECRAFT_PAPER', 'MINECRAFT_FABRIC', 'MINECRAFT_FORGE', 'DISCORD_NODE', 'DISCORD_PYTHON'])
  platform: string;

  @ApiProperty({
    enum: ['JAVA', 'KOTLIN', 'JAVASCRIPT', 'TYPESCRIPT', 'PYTHON'],
  })
  @IsIn(['JAVA', 'KOTLIN', 'JAVASCRIPT', 'TYPESCRIPT', 'PYTHON'])
  language: string;

  @ApiPropertyOptional({ example: 'paper-basic' })
  @IsString()
  @IsOptional()
  template?: string;

  @ApiPropertyOptional({ example: '1.20' })
  @IsString()
  @IsOptional()
  apiVersion?: string;

  @ApiPropertyOptional({ example: 'com.example.myplugin' })
  @IsString()
  @IsOptional()
  packageName?: string;

  @ApiPropertyOptional({ example: '!' })
  @IsString()
  @IsOptional()
  commandPrefix?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'My Updated Plugin' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}

export class GenerateCodeDto {
  @ApiProperty({ example: 'Create a teleportation command that lets players send requests' })
  @IsString()
  prompt: string;

  @ApiProperty({
    enum: ['CLAUDE_SONNET_4_5', 'CLAUDE_OPUS_4_5', 'GPT_5', 'GEMINI_3_PRO', 'GROK_4_1_FAST'],
  })
  @IsIn(['CLAUDE_SONNET_4_5', 'CLAUDE_OPUS_4_5', 'GPT_5', 'GEMINI_3_PRO', 'GROK_4_1_FAST'])
  model: string;

  @ApiPropertyOptional({ description: 'Additional context for generation' })
  @IsObject()
  @IsOptional()
  context?: {
    files?: string[];
    docs?: string[];
    settings?: Record<string, any>;
  };
}

export class UpdateFileDto {
  @ApiProperty({ example: 'console.log("Hello World");' })
  @IsString()
  content: string;
}

export class CreateFileDto {
  @ApiProperty({ example: 'src/commands/hello.ts' })
  @IsString()
  path: string;

  @ApiPropertyOptional({ example: '// New file' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDirectory?: boolean;
}

export class CreateCheckpointDto {
  @ApiProperty({ example: 'Added teleport command' })
  @IsString()
  summary: string;
}
