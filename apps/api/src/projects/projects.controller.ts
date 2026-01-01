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
import { ProjectsService } from './projects.service';
import { CheckpointsService } from '../checkpoints/checkpoints.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  GenerateCodeDto,
  UpdateFileDto,
  CreateFileDto,
  CreateCheckpointDto,
} from './dto/projects.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly checkpointsService: CheckpointsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created' })
  async create(@Request() req: any, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects for current user' })
  @ApiResponse({ status: 200, description: 'List of projects' })
  async findAll(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.projectsService.findAll(req.user.id, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiResponse({ status: 200, description: 'Project details' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.projectsService.findOne(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, description: 'Project updated' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 200, description: 'Project deleted' })
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.projectsService.delete(req.user.id, id);
  }

  // Generation
  @Post(':id/generate')
  @ApiOperation({ summary: 'Generate code for project using AI' })
  @ApiResponse({ status: 200, description: 'Generation job queued' })
  async generate(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: GenerateCodeDto,
  ) {
    return this.projectsService.generateCode(req.user.id, id, dto);
  }

  @Get(':id/jobs/:jobId')
  @ApiOperation({ summary: 'Get generation job status' })
  @ApiResponse({ status: 200, description: 'Job status' })
  async getJob(
    @Request() req: any,
    @Param('id') id: string,
    @Param('jobId') jobId: string,
  ) {
    return this.projectsService.getGenerationJob(req.user.id, id, jobId);
  }

  // Files
  @Post(':id/files')
  @ApiOperation({ summary: 'Create a new file in project' })
  @ApiResponse({ status: 201, description: 'File created' })
  async createFile(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreateFileDto,
  ) {
    return this.projectsService.createFile(req.user.id, id, dto);
  }

  @Put(':id/files/:fileId')
  @ApiOperation({ summary: 'Update file content' })
  @ApiResponse({ status: 200, description: 'File updated' })
  async updateFile(
    @Request() req: any,
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @Body() dto: UpdateFileDto,
  ) {
    return this.projectsService.updateFile(req.user.id, id, fileId, dto);
  }

  @Delete(':id/files/:fileId')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 200, description: 'File deleted' })
  async deleteFile(
    @Request() req: any,
    @Param('id') id: string,
    @Param('fileId') fileId: string,
  ) {
    return this.projectsService.deleteFile(req.user.id, id, fileId);
  }

  // Checkpoints
  @Post(':id/checkpoints')
  @ApiOperation({ summary: 'Create a checkpoint' })
  @ApiResponse({ status: 201, description: 'Checkpoint created' })
  async createCheckpoint(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CreateCheckpointDto,
  ) {
    return this.checkpointsService.create(req.user.id, id, dto.summary);
  }

  @Get(':id/checkpoints')
  @ApiOperation({ summary: 'Get project checkpoints' })
  @ApiResponse({ status: 200, description: 'List of checkpoints' })
  async getCheckpoints(
    @Request() req: any,
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.checkpointsService.findByProject(req.user.id, id, page, limit);
  }

  @Post(':id/restore-checkpoint')
  @ApiOperation({ summary: 'Restore project to a checkpoint' })
  @ApiResponse({ status: 200, description: 'Project restored' })
  async restoreCheckpoint(
    @Request() req: any,
    @Param('id') id: string,
    @Body('checkpointId') checkpointId: string,
  ) {
    return this.checkpointsService.restore(req.user.id, id, checkpointId);
  }

  // Build
  @Post(':id/build')
  @ApiOperation({ summary: 'Build the project' })
  @ApiResponse({ status: 200, description: 'Build job queued' })
  async build(@Request() req: any, @Param('id') id: string) {
    return this.projectsService.buildProject(req.user.id, id);
  }
}
