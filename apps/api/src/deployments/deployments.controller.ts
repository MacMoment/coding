import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DeploymentsService } from './deployments.service';
import { CreateDeploymentDto, UpdateSecretsDto } from './dto/deployments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('deployments')
@Controller('deployments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Deploy a Discord bot' })
  @ApiResponse({ status: 201, description: 'Deployment started' })
  async deploy(@Request() req: any, @Body() dto: CreateDeploymentDto) {
    return this.deploymentsService.deploy(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user deployments' })
  @ApiResponse({ status: 200, description: 'List of deployments' })
  async getDeployments(
    @Request() req: any,
    @Query('projectId') projectId?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.deploymentsService.getDeployments(req.user.id, projectId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deployment details' })
  @ApiResponse({ status: 200, description: 'Deployment details' })
  @ApiResponse({ status: 404, description: 'Deployment not found' })
  async getDeployment(@Request() req: any, @Param('id') id: string) {
    return this.deploymentsService.getDeployment(req.user.id, id);
  }

  @Post(':id/stop')
  @ApiOperation({ summary: 'Stop a deployment' })
  @ApiResponse({ status: 200, description: 'Deployment stopped' })
  async stop(@Request() req: any, @Param('id') id: string) {
    return this.deploymentsService.stopDeployment(req.user.id, id);
  }

  @Post(':id/restart')
  @ApiOperation({ summary: 'Restart a deployment' })
  @ApiResponse({ status: 200, description: 'Deployment restarting' })
  async restart(@Request() req: any, @Param('id') id: string) {
    return this.deploymentsService.restartDeployment(req.user.id, id);
  }

  @Put(':id/secrets')
  @ApiOperation({ summary: 'Update deployment secrets' })
  @ApiResponse({ status: 200, description: 'Secrets updated' })
  async updateSecrets(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateSecretsDto,
  ) {
    return this.deploymentsService.updateSecrets(req.user.id, id, dto);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get deployment logs' })
  @ApiResponse({ status: 200, description: 'Deployment logs' })
  async getLogs(
    @Request() req: any,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ) {
    return this.deploymentsService.getLogs(req.user.id, id, page, limit);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a deployment' })
  @ApiResponse({ status: 200, description: 'Deployment deleted' })
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.deploymentsService.deleteDeployment(req.user.id, id);
  }
}
