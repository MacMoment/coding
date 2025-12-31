import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { ContributeDocDto, ImportDocsDto } from './dto/docs.dto';
import { Platform } from '@forgecraft/database';

interface DocSearchResult {
  id: string;
  title: string;
  platform: string;
  version: string;
  content: string;
  relevance: number;
}

@Injectable()
export class DocsService {
  private readonly logger = new Logger(DocsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async search(query: string, platform?: string, version?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (platform) {
      where.platform = platform;
    }
    
    if (version) {
      where.version = version;
    }

    // Simple text search (in production, use vector similarity)
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } },
    ];

    const [docs, total] = await Promise.all([
      this.prisma.docEntry.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          platform: true,
          version: true,
          content: true,
          source: true,
          isOfficial: true,
          contributor: {
            select: {
              displayName: true,
            },
          },
        },
      }),
      this.prisma.docEntry.count({ where }),
    ]);

    return {
      items: docs,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchForGeneration(prompt: string, platform: string): Promise<DocSearchResult[]> {
    // Extract keywords from prompt
    const keywords = this.extractKeywords(prompt);
    
    if (keywords.length === 0) {
      return [];
    }

    // Search for relevant docs
    const docs = await this.prisma.docEntry.findMany({
      where: {
        platform: platform as Platform,
        OR: keywords.map(keyword => ({
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { content: { contains: keyword, mode: 'insensitive' } },
          ],
        })),
      },
      take: 5,
      select: {
        id: true,
        title: true,
        platform: true,
        version: true,
        content: true,
      },
    });

    // Calculate simple relevance score
    return docs.map(doc => {
      let relevance = 0;
      const lowerContent = doc.content.toLowerCase();
      const lowerTitle = doc.title.toLowerCase();
      
      for (const keyword of keywords) {
        const lower = keyword.toLowerCase();
        if (lowerTitle.includes(lower)) relevance += 2;
        if (lowerContent.includes(lower)) relevance += 1;
      }
      
      return {
        ...doc,
        relevance: relevance / keywords.length,
      };
    }).sort((a, b) => b.relevance - a.relevance);
  }

  private extractKeywords(text: string): string[] {
    // Remove common words and extract keywords
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
      'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
      'into', 'through', 'during', 'before', 'after', 'above', 'below',
      'between', 'under', 'again', 'further', 'then', 'once', 'here',
      'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more',
      'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
      'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or',
      'because', 'until', 'while', 'that', 'which', 'who', 'what', 'this',
      'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'it',
      'create', 'make', 'build', 'add', 'want', 'plugin', 'bot', 'mod',
    ]);

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    // Get unique words
    return [...new Set(words)];
  }

  async contribute(userId: string, dto: ContributeDocDto) {
    return this.prisma.docEntry.create({
      data: {
        title: dto.title,
        platform: dto.platform as Platform,
        version: dto.version,
        content: dto.content,
        source: dto.source,
        contributorId: userId,
        isOfficial: false,
      },
    });
  }

  async importDocs(dto: ImportDocsDto) {
    const results = [];

    for (const doc of dto.docs) {
      const created = await this.prisma.docEntry.create({
        data: {
          title: doc.title,
          platform: doc.platform as Platform,
          version: doc.version,
          content: doc.content,
          source: doc.source,
          isOfficial: true,
        },
      });
      results.push(created);
    }

    this.logger.log(`Imported ${results.length} documentation entries`);

    return {
      imported: results.length,
      docs: results.map(d => ({ id: d.id, title: d.title })),
    };
  }

  async getDoc(docId: string) {
    const doc = await this.prisma.docEntry.findUnique({
      where: { id: docId },
      include: {
        contributor: {
          select: {
            displayName: true,
          },
        },
      },
    });

    if (!doc) {
      throw new NotFoundException('Documentation not found');
    }

    return doc;
  }

  async deleteDoc(docId: string) {
    await this.prisma.docEntry.delete({
      where: { id: docId },
    });

    return { message: 'Documentation deleted' };
  }

  async getStats() {
    const [total, byPlatform] = await Promise.all([
      this.prisma.docEntry.count(),
      this.prisma.docEntry.groupBy({
        by: ['platform'],
        _count: true,
      }),
    ]);

    return {
      total,
      byPlatform: byPlatform.map(p => ({
        platform: p.platform,
        count: p._count,
      })),
    };
  }
}
