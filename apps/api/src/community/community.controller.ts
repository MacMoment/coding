import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { PublishProjectDto, CreateCommentDto, ReportDto } from './dto/community.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('community')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  @ApiOperation({ summary: 'Get community gallery' })
  @ApiResponse({ status: 200, description: 'List of published projects' })
  async getGallery(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('platform') platform?: string,
    @Query('tags') tags?: string,
    @Query('featured') featured?: boolean,
    @Query('search') search?: string,
    @Query('sort') sort?: 'downloads' | 'likes' | 'recent',
  ) {
    return this.communityService.getGallery(page, limit, {
      platform,
      tags: tags ? tags.split(',') : undefined,
      featured,
      search,
      sort,
    });
  }

  @Get(':postId')
  @ApiOperation({ summary: 'Get a community post' })
  @ApiResponse({ status: 200, description: 'Post details' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async getPost(@Param('postId') postId: string) {
    return this.communityService.getPost(postId);
  }

  @Post('publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a project to the community' })
  @ApiResponse({ status: 201, description: 'Project published' })
  async publish(@Request() req: any, @Body() dto: PublishProjectDto) {
    return this.communityService.publish(req.user.id, dto);
  }

  @Delete(':postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unpublish a project' })
  @ApiResponse({ status: 200, description: 'Project unpublished' })
  async unpublish(@Request() req: any, @Param('postId') postId: string) {
    return this.communityService.unpublish(req.user.id, postId);
  }

  @Post(':postId/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like/unlike a post' })
  @ApiResponse({ status: 200, description: 'Like toggled' })
  async likePost(@Request() req: any, @Param('postId') postId: string) {
    return this.communityService.likePost(req.user.id, postId);
  }

  @Get(':postId/liked')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if user has liked a post' })
  @ApiResponse({ status: 200, description: 'Like status' })
  async hasLiked(@Request() req: any, @Param('postId') postId: string) {
    const liked = await this.communityService.hasLiked(req.user.id, postId);
    return { liked };
  }

  @Post(':postId/comment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to a post' })
  @ApiResponse({ status: 201, description: 'Comment added' })
  async addComment(
    @Request() req: any,
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.communityService.addComment(req.user.id, postId, dto);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  async deleteComment(@Request() req: any, @Param('commentId') commentId: string) {
    return this.communityService.deleteComment(req.user.id, commentId);
  }

  @Post(':postId/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report a post' })
  @ApiResponse({ status: 201, description: 'Report submitted' })
  async reportPost(
    @Request() req: any,
    @Param('postId') postId: string,
    @Body() dto: ReportDto,
  ) {
    return this.communityService.reportPost(req.user.id, postId, dto);
  }

  @Get(':postId/download')
  @ApiOperation({ summary: 'Download a project' })
  @ApiResponse({ status: 200, description: 'Project files' })
  async download(@Param('postId') postId: string) {
    return this.communityService.downloadProject(postId);
  }
}
