import { IsString, IsArray, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublishProjectDto {
  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty({ example: 'My Awesome Plugin' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'A plugin that does amazing things' })
  @IsString()
  @MaxLength(1000)
  description: string;

  @ApiProperty({ example: ['minecraft', 'teleport', 'utility'] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiPropertyOptional({ example: ['https://example.com/screenshot.png'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  screenshots?: string[];

  @ApiPropertyOptional({ example: '1.0.0' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({ example: 'MIT' })
  @IsString()
  @IsOptional()
  license?: string;
}

export class CreateCommentDto {
  @ApiProperty({ example: 'Great plugin!' })
  @IsString()
  @MaxLength(1000)
  content: string;
}

export class ReportDto {
  @ApiProperty({ example: 'spam' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 'This project contains inappropriate content' })
  @IsString()
  @IsOptional()
  details?: string;
}
