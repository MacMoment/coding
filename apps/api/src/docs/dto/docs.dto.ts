import { IsString, IsArray, IsIn, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ContributeDocDto {
  @ApiProperty({ example: 'How to create commands' })
  @IsString()
  title: string;

  @ApiProperty({
    enum: ['MINECRAFT_SPIGOT', 'MINECRAFT_PAPER', 'MINECRAFT_FABRIC', 'MINECRAFT_FORGE', 'DISCORD_NODE', 'DISCORD_PYTHON'],
  })
  @IsIn(['MINECRAFT_SPIGOT', 'MINECRAFT_PAPER', 'MINECRAFT_FABRIC', 'MINECRAFT_FORGE', 'DISCORD_NODE', 'DISCORD_PYTHON'])
  platform: string;

  @ApiProperty({ example: '1.20' })
  @IsString()
  version: string;

  @ApiProperty({ example: 'Documentation content here...' })
  @IsString()
  content: string;

  @ApiProperty({ example: 'https://docs.example.com/commands' })
  @IsString()
  source: string;
}

class DocEntryDto {
  @IsString()
  title: string;

  @IsIn(['MINECRAFT_SPIGOT', 'MINECRAFT_PAPER', 'MINECRAFT_FABRIC', 'MINECRAFT_FORGE', 'DISCORD_NODE', 'DISCORD_PYTHON'])
  platform: string;

  @IsString()
  version: string;

  @IsString()
  content: string;

  @IsString()
  source: string;
}

export class ImportDocsDto {
  @ApiProperty({ type: [DocEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocEntryDto)
  docs: DocEntryDto[];
}
