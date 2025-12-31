# ForgeCraft AI

AI-powered builder for Minecraft plugins and Discord bots. Generate, edit, and deploy your projects with ease.

## Features

- 🤖 **AI Code Generation** - Generate production-ready code using Claude, GPT-5, Gemini, or Grok
- 📝 **Web IDE** - Full-featured Monaco editor with syntax highlighting and file management
- 🚀 **One-Click Deploy** - Deploy Discord bots instantly to cloud infrastructure
- 💾 **Version Checkpoints** - Save and restore project states with automatic backups
- 👥 **Community Gallery** - Share and discover projects from other developers
- 📚 **Smart Docs** - AI-powered documentation search with context injection
- 💰 **Token Economy** - Flexible pay-as-you-go and subscription pricing

## Supported Platforms

### Minecraft
- Spigot Plugins (Java)
- Paper Plugins (Java/Kotlin)
- Fabric Mods
- Forge Mods

### Discord
- Discord.js Bots (TypeScript/JavaScript)
- discord.py Bots (Python)

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS + shadcn/ui
- Zustand for state management
- Monaco Editor

### Backend
- NestJS
- PostgreSQL + Prisma ORM
- Redis (rate limiting, queues)
- BullMQ for job processing
- Stripe for payments

### Infrastructure
- Docker
- S3-compatible storage (MinIO/AWS S3/Cloudflare R2)
- Vercel (frontend hosting)
- Any VPS for backend

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/forgecraft-ai.git
   cd forgecraft-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start infrastructure services**
   ```bash
   docker compose up -d
   ```
   This starts PostgreSQL, Redis, and MinIO.

5. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

6. **Start the development servers**
   ```bash
   npm run dev
   ```

   This starts:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Docs: http://localhost:3001/api/docs

### Demo Accounts

After running the seed script, you can use these accounts:

| Email | Password | Role | Tier |
|-------|----------|------|------|
| admin@forgecraft.ai | admin123 | Admin | Elite |
| demo@forgecraft.ai | demo123 | User | Starter |
| free@forgecraft.ai | free123 | User | Free |

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/forgecraft"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# AI API
MEGALLM_API_KEY="your-api-key"
MEGALLM_API_URL="https://api.megallm.com/v1"

# S3 Storage
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="forgecraft"
S3_REGION="us-east-1"

# App URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the dashboard
3. Create subscription products:
   - Starter ($9.99/month)
   - Pro ($29.99/month)
   - Elite ($99.99/month)
4. Create token pack products for one-time purchases
5. Set up webhook endpoint: `POST /api/billing/webhook`

### AI Models

The platform supports multiple AI providers through a unified interface:

| Model | Provider | Best For |
|-------|----------|----------|
| Claude Sonnet 4.5 | Anthropic | Fast, general purpose |
| Claude Opus 4.5 | Anthropic | Complex tasks |
| GPT-5 | OpenAI | Versatile |
| Gemini 3 Pro | Google | Long context |
| Grok 4.1 Fast | xAI | Budget-friendly |

## VPS Deployment Guide

### Prerequisites

- Ubuntu 22.04 LTS (or similar)
- 4GB RAM minimum
- 20GB storage
- Domain name with DNS configured

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js (for building)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install nginx
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Step 2: Clone and Configure

```bash
# Clone repository
git clone https://github.com/your-org/forgecraft-ai.git
cd forgecraft-ai

# Create production environment file
cp .env.example .env.production
nano .env.production
# Configure all variables for production
```

### Step 3: Build and Deploy

```bash
# Build containers
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run database migrations
docker compose exec api npm run db:migrate:deploy
docker compose exec api npm run db:seed
```

### Step 4: Configure Nginx

```nginx
# /etc/nginx/sites-available/forgecraft
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/forgecraft /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

### Step 5: Set Up Backups

```bash
# Database backup script
cat > /home/user/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T postgres pg_dump -U postgres forgecraft > /backups/db_$DATE.sql
find /backups -name "db_*.sql" -mtime +7 -delete
EOF

chmod +x /home/user/backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /home/user/backup.sh
```

## API Documentation

API documentation is available at `/api/docs` when running the server.

### Key Endpoints

#### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login
- `POST /api/auth/oauth` - OAuth login
- `GET /api/auth/me` - Get current user

#### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `POST /api/projects/:id/generate` - Generate code with AI
- `POST /api/projects/:id/checkpoints` - Create checkpoint
- `POST /api/projects/:id/build` - Build project

#### Billing
- `GET /api/billing/plans` - Get subscription plans
- `POST /api/billing/checkout` - Create checkout session
- `POST /api/billing/webhook` - Stripe webhook

#### Community
- `GET /api/community` - Browse gallery
- `POST /api/community/publish` - Publish project
- `POST /api/community/:postId/like` - Like/unlike

## Project Structure

```
forgecraft-ai/
├── apps/
│   ├── api/                 # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/        # Authentication module
│   │   │   ├── users/       # User management
│   │   │   ├── projects/    # Project management
│   │   │   ├── ai/          # AI code generation
│   │   │   ├── billing/     # Stripe integration
│   │   │   ├── community/   # Gallery & social
│   │   │   ├── docs/        # Documentation system
│   │   │   ├── checkpoints/ # Version control
│   │   │   └── deployments/ # Bot deployment
│   │   └── Dockerfile
│   └── web/                 # Next.js frontend
│       ├── app/             # App router pages
│       ├── components/      # UI components
│       ├── lib/             # Utilities
│       ├── hooks/           # Custom hooks
│       ├── store/           # Zustand stores
│       └── Dockerfile
├── packages/
│   ├── database/            # Prisma schema & client
│   └── shared/              # Shared types & constants
├── docker/
│   └── sandbox/             # Sandbox runner
├── scripts/                 # Utility scripts
├── docker-compose.yml       # Development setup
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- Documentation: [docs.forgecraft.ai](https://docs.forgecraft.ai)
- Discord: [discord.gg/forgecraft](https://discord.gg/forgecraft)
- Email: support@forgecraft.ai
