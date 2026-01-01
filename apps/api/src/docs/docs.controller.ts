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
import { DocsService } from './docs.service';
import { ContributeDocDto, ImportDocsDto } from './dto/docs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('docs')
@Controller('docs')
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search documentation' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @Query('q') query: string,
    @Query('platform') platform?: string,
    @Query('version') version?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.docsService.search(query, platform, version, page, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get documentation statistics' })
  @ApiResponse({ status: 200, description: 'Documentation stats' })
  async getStats() {
    return this.docsService.getStats();
  }

  @Get(':docId')
  @ApiOperation({ summary: 'Get a documentation entry' })
  @ApiResponse({ status: 200, description: 'Documentation entry' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getDoc(@Param('docId') docId: string) {
    return this.docsService.getDoc(docId);
  }

  @Post('contribute')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Contribute a documentation entry' })
  @ApiResponse({ status: 201, description: 'Documentation created' })
  async contribute(@Request() req: any, @Body() dto: ContributeDocDto) {
    return this.docsService.contribute(req.user.id, dto);
  }

  @Post('admin/import')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import official documentation (admin only)' })
  @ApiResponse({ status: 201, description: 'Documentation imported' })
  async importDocs(@Body() dto: ImportDocsDto) {
    // In production, add admin role check
    return this.docsService.importDocs(dto);
  }

  @Delete('admin/:docId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a documentation entry (admin only)' })
  @ApiResponse({ status: 200, description: 'Documentation deleted' })
  async deleteDoc(@Param('docId') docId: string) {
    // In production, add admin role check
    return this.docsService.deleteDoc(docId);
  }
}
