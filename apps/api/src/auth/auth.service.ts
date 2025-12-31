import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { SignUpDto, SignInDto, ResetPasswordDto } from './dto/auth.dto';
import { TOKEN_COSTS } from '@forgecraft/shared';
import { TransactionType } from '@forgecraft/database';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async signUp(dto: SignUpDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName || dto.email.split('@')[0],
        tokenBalance: TOKEN_COSTS.WELCOME_BONUS,
      },
    });

    // Create welcome bonus transaction
    await this.prisma.tokenTransaction.create({
      data: {
        userId: user.id,
        amount: TOKEN_COSTS.WELCOME_BONUS,
        type: TransactionType.WELCOME_BONUS,
        description: 'Welcome bonus for new account',
      },
    });

    // Handle referral bonus
    if (dto.referralCode) {
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode: dto.referralCode },
      });
      if (referrer) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { referredBy: referrer.id },
        });
        await this.usersService.addTokens(referrer.id, TOKEN_COSTS.REFERRAL_BONUS, 'Referral bonus');
      }
    }

    this.logger.log(`User signed up: ${user.email}`);

    // Generate token and create session
    const { accessToken, session } = await this.createSession(user.id);

    return {
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  async signIn(dto: SignInDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User signed in: ${user.email}`);

    const { accessToken } = await this.createSession(user.id);

    return {
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async createSession(userId: string) {
    const payload = { sub: userId };
    const accessToken = this.jwtService.sign(payload);

    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await this.prisma.session.create({
      data: {
        userId,
        token: accessToken,
        expiresAt,
      },
    });

    return { accessToken, session };
  }

  async signOut(token: string) {
    await this.prisma.session.deleteMany({
      where: { token },
    });
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // In production, send email with reset link
    // For now, just log it
    this.logger.log(`Password reset requested for: ${dto.email}`);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async handleOAuthLogin(provider: 'google' | 'github', profile: any) {
    const providerId = provider === 'google' ? 'googleId' : 'githubId';
    
    // Check if user exists with this OAuth ID
    let user = await this.prisma.user.findFirst({
      where: { [providerId]: profile.id },
    });

    if (!user) {
      // Check if email exists
      user = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        // Link OAuth to existing user
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { [providerId]: profile.id },
        });
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            displayName: profile.name || profile.email.split('@')[0],
            avatar: profile.avatar,
            [providerId]: profile.id,
            emailVerified: true,
            tokenBalance: TOKEN_COSTS.WELCOME_BONUS,
          },
        });

        // Create welcome bonus transaction
        await this.prisma.tokenTransaction.create({
          data: {
            userId: user.id,
            amount: TOKEN_COSTS.WELCOME_BONUS,
            type: TransactionType.WELCOME_BONUS,
            description: 'Welcome bonus for new account',
          },
        });
      }
    }

    const { accessToken } = await this.createSession(user.id);

    return {
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
