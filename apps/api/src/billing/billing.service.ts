import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { PRICING_TIERS, TOKEN_PACKS } from '@forgecraft/shared';
import { SubscriptionTier, SubscriptionStatus, TransactionType } from '@forgecraft/database';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {
    const stripeKey = this.configService.get('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(stripeKey || 'sk_test_placeholder', {
      apiVersion: '2023-10-16',
    });
  }

  getPlans() {
    return Object.entries(PRICING_TIERS).map(([key, tier]) => ({
      id: key,
      ...tier,
      priceFormatted: tier.price === 0 ? 'Free' : `$${(tier.price / 100).toFixed(2)}/mo`,
    }));
  }

  getTokenPacks() {
    return Object.entries(TOKEN_PACKS).map(([key, pack]) => ({
      id: key,
      ...pack,
      priceFormatted: `$${(pack.price / 100).toFixed(2)}`,
    }));
  }

  async createCheckoutSession(userId: string, tier: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const tierConfig = PRICING_TIERS[tier as keyof typeof PRICING_TIERS];
    if (!tierConfig || tierConfig.price === 0) {
      throw new BadRequestException('Invalid tier');
    }

    // Get or create Stripe customer
    let customerId: string;
    const existingSub = await this.prisma.subscription.findFirst({
      where: { userId },
    });

    if (existingSub?.stripeCustomerId) {
      customerId = existingSub.stripeCustomerId;
    } else {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.displayName,
        metadata: { userId },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: tierConfig.priceId || undefined,
          quantity: 1,
        },
      ],
      success_url: `${this.configService.get('NEXT_PUBLIC_APP_URL')}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('NEXT_PUBLIC_APP_URL')}/billing/cancel`,
      metadata: {
        userId,
        tier,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async createTokenPackCheckout(userId: string, packId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const pack = TOKEN_PACKS[packId as keyof typeof TOKEN_PACKS];
    if (!pack) {
      throw new BadRequestException('Invalid token pack');
    }

    // Get or create Stripe customer
    let customerId: string;
    const existingSub = await this.prisma.subscription.findFirst({
      where: { userId },
    });

    if (existingSub?.stripeCustomerId) {
      customerId = existingSub.stripeCustomerId;
    } else {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.displayName,
        metadata: { userId },
      });
      customerId = customer.id;
    }

    // Create checkout session for one-time payment
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: pack.priceId || undefined,
          quantity: 1,
        },
      ],
      success_url: `${this.configService.get('NEXT_PUBLIC_APP_URL')}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('NEXT_PUBLIC_APP_URL')}/billing/cancel`,
      metadata: {
        userId,
        packId,
        type: 'token_pack',
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret || '');
    } catch (err) {
      this.logger.error('Webhook signature verification failed', err);
      throw new BadRequestException('Webhook signature verification failed');
    }

    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const type = session.metadata?.type;

    if (!userId) {
      this.logger.error('No userId in checkout session metadata');
      return;
    }

    if (type === 'token_pack') {
      // Handle token pack purchase
      const packId = session.metadata?.packId;
      const pack = TOKEN_PACKS[packId as keyof typeof TOKEN_PACKS];
      if (pack) {
        const totalTokens = pack.tokens + ((pack as any).bonus || 0);
        await this.usersService.addTokens(
          userId,
          totalTokens,
          `Token pack purchase: ${pack.name}`,
          TransactionType.TOKEN_PACK_PURCHASE,
        );
        this.logger.log(`Added ${totalTokens} tokens to user ${userId}`);
      }
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    
    // Find user by customer ID
    const existingSub = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!existingSub) {
      this.logger.warn(`No subscription found for customer: ${customerId}`);
      return;
    }

    // Determine tier from price
    const priceId = subscription.items.data[0]?.price?.id;
    let tier: SubscriptionTier = SubscriptionTier.FREE;
    
    for (const [key, tierConfig] of Object.entries(PRICING_TIERS)) {
      if (tierConfig.priceId === priceId) {
        tier = key as SubscriptionTier;
        break;
      }
    }

    // Update subscription
    await this.prisma.subscription.update({
      where: { id: existingSub.id },
      data: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        tier,
        status: this.mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    // Update user tier
    await this.usersService.updateSubscriptionTier(existingSub.userId, tier);
    
    this.logger.log(`Updated subscription for user ${existingSub.userId} to ${tier}`);
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const existingSub = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!existingSub) {
      return;
    }

    await this.prisma.subscription.update({
      where: { id: existingSub.id },
      data: { status: SubscriptionStatus.CANCELED },
    });

    // Downgrade user to free
    await this.usersService.updateSubscriptionTier(existingSub.userId, SubscriptionTier.FREE);
    
    this.logger.log(`Subscription canceled for user ${existingSub.userId}`);
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    if (invoice.billing_reason !== 'subscription_cycle') {
      return;
    }

    const subscriptionId = invoice.subscription as string;
    const existingSub = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!existingSub) {
      return;
    }

    // Refill tokens for the new billing cycle
    await this.usersService.refillSubscriptionTokens(existingSub.userId);
    
    this.logger.log(`Refilled tokens for user ${existingSub.userId}`);
  }

  private async handleInvoiceFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    const existingSub = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!existingSub) {
      return;
    }

    await this.prisma.subscription.update({
      where: { id: existingSub.id },
      data: { status: SubscriptionStatus.PAST_DUE },
    });
    
    this.logger.log(`Payment failed for user ${existingSub.userId}`);
  }

  private mapStripeStatus(status: string): SubscriptionStatus {
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      unpaid: SubscriptionStatus.UNPAID,
    };
    return statusMap[status] || SubscriptionStatus.ACTIVE;
  }

  async getPortalSession(userId: string) {
    const existingSub = await this.prisma.subscription.findFirst({
      where: { userId },
    });

    if (!existingSub?.stripeCustomerId) {
      throw new BadRequestException('No billing account found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: existingSub.stripeCustomerId,
      return_url: `${this.configService.get('NEXT_PUBLIC_APP_URL')}/dashboard`,
    });

    return { url: session.url };
  }
}
