import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }
}

@ApiTags('tokens')
@Controller('tokens')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TokensController {
  constructor(private readonly usersService: UsersService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get token balance' })
  @ApiResponse({ status: 200, description: 'Token balance and tier' })
  async getBalance(@Request() req: any) {
    return this.usersService.getTokenBalance(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get token transaction history' })
  @ApiResponse({ status: 200, description: 'Token transactions' })
  async getHistory(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.usersService.getTokenHistory(req.user.id, page, limit);
  }

  @Post('claim-daily')
  @ApiOperation({ summary: 'Claim daily free tokens' })
  @ApiResponse({ status: 200, description: 'Tokens claimed' })
  @ApiResponse({ status: 400, description: 'Already claimed today' })
  async claimDaily(@Request() req: any) {
    return this.usersService.claimDailyTokens(req.user.id);
  }
}
