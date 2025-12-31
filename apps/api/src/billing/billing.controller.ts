import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Req,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiResponse({ status: 200, description: 'List of plans' })
  getPlans() {
    return this.billingService.getPlans();
  }

  @Get('token-packs')
  @ApiOperation({ summary: 'Get available token packs' })
  @ApiResponse({ status: 200, description: 'List of token packs' })
  getTokenPacks() {
    return this.billingService.getTokenPacks();
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create checkout session for subscription' })
  @ApiResponse({ status: 200, description: 'Checkout session created' })
  async createCheckout(@Request() req: any, @Body('tier') tier: string) {
    return this.billingService.createCheckoutSession(req.user.id, tier);
  }

  @Post('token-pack')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create checkout session for token pack' })
  @ApiResponse({ status: 200, description: 'Checkout session created' })
  async createTokenPackCheckout(@Request() req: any, @Body('packId') packId: string) {
    return this.billingService.createTokenPackCheckout(req.user.id, packId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const payload = req.rawBody;
    if (!payload) {
      throw new Error('Missing request body');
    }
    return this.billingService.handleWebhook(payload, signature);
  }

  @Get('portal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Stripe customer portal URL' })
  @ApiResponse({ status: 200, description: 'Portal URL' })
  async getPortal(@Request() req: any) {
    return this.billingService.getPortalSession(req.user.id);
  }
}
