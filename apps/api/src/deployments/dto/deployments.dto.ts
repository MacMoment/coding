import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeploymentDto {
  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiPropertyOptional({ example: 'us-east-1' })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({ 
    example: { DISCORD_TOKEN: 'your-bot-token' },
    description: 'Environment secrets for the deployment'
  })
  @IsObject()
  @IsOptional()
  secrets?: Record<string, string>;
}

export class UpdateSecretsDto {
  @ApiProperty({ 
    example: { DISCORD_TOKEN: 'updated-token', NEW_SECRET: 'value' },
    description: 'Secrets to add or update'
  })
  @IsObject()
  secrets: Record<string, string>;
}
