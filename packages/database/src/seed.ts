import { PrismaClient, UserRole, SubscriptionTier, Platform, Language, AIModel, AIProvider, TransactionType } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.docUsage.deleteMany();
  await prisma.docEmbedding.deleteMany();
  await prisma.docEntry.deleteMany();
  await prisma.report.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.deploymentLog.deleteMany();
  await prisma.deployment.deleteMany();
  await prisma.generationJob.deleteMany();
  await prisma.checkpoint.deleteMany();
  await prisma.projectFile.deleteMany();
  await prisma.project.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.tokenTransaction.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@forgecraft.ai',
      passwordHash: await hashPassword('admin123'),
      displayName: 'Admin',
      role: UserRole.ADMIN,
      subscriptionTier: SubscriptionTier.ELITE,
      tokenBalance: 10000,
      emailVerified: true,
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create demo users
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@forgecraft.ai',
      passwordHash: await hashPassword('demo123'),
      displayName: 'Demo User',
      role: UserRole.USER,
      subscriptionTier: SubscriptionTier.STARTER,
      tokenBalance: 500,
      emailVerified: true,
    },
  });
  console.log('✅ Created demo user:', demoUser.email);

  const freeUser = await prisma.user.create({
    data: {
      email: 'free@forgecraft.ai',
      passwordHash: await hashPassword('free123'),
      displayName: 'Free User',
      role: UserRole.USER,
      subscriptionTier: SubscriptionTier.FREE,
      tokenBalance: 100,
      emailVerified: true,
    },
  });
  console.log('✅ Created free user:', freeUser.email);

  // Create welcome bonus transactions
  await prisma.tokenTransaction.createMany({
    data: [
      {
        userId: admin.id,
        amount: 10000,
        type: TransactionType.WELCOME_BONUS,
        description: 'Welcome bonus for admin account',
      },
      {
        userId: demoUser.id,
        amount: 500,
        type: TransactionType.WELCOME_BONUS,
        description: 'Welcome bonus for new account',
      },
      {
        userId: freeUser.id,
        amount: 100,
        type: TransactionType.WELCOME_BONUS,
        description: 'Welcome bonus for new account',
      },
    ],
  });
  console.log('✅ Created token transactions');

  // Create sample projects
  const minecraftProject = await prisma.project.create({
    data: {
      userId: demoUser.id,
      name: 'Teleport Plugin',
      description: 'A simple teleportation plugin for Minecraft servers',
      platform: Platform.MINECRAFT_PAPER,
      language: Language.JAVA,
      isPublic: true,
      apiVersion: '1.20',
      packageName: 'com.example.teleport',
      files: {
        create: [
          {
            path: 'src/main/java/com/example/teleport/TeleportPlugin.java',
            content: `package com.example.teleport;

import org.bukkit.plugin.java.JavaPlugin;

public class TeleportPlugin extends JavaPlugin {
    @Override
    public void onEnable() {
        getLogger().info("TeleportPlugin enabled!");
        getCommand("tpa").setExecutor(new TpaCommand(this));
    }

    @Override
    public void onDisable() {
        getLogger().info("TeleportPlugin disabled!");
    }
}`,
          },
          {
            path: 'src/main/resources/plugin.yml',
            content: `name: TeleportPlugin
version: 1.0.0
main: com.example.teleport.TeleportPlugin
api-version: '1.20'
commands:
  tpa:
    description: Send a teleport request
    usage: /tpa <player>
permissions:
  teleport.use:
    default: true`,
          },
          {
            path: 'build.gradle',
            content: `plugins {
    id 'java'
}

group = 'com.example'
version = '1.0.0'

repositories {
    mavenCentral()
    maven { url = 'https://repo.papermc.io/repository/maven-public/' }
}

dependencies {
    compileOnly 'io.papermc.paper:paper-api:1.20.4-R0.1-SNAPSHOT'
}

java {
    toolchain.languageVersion.set(JavaLanguageVersion.of(17))
}`,
          },
        ],
      },
    },
  });
  console.log('✅ Created Minecraft project:', minecraftProject.name);

  const discordProject = await prisma.project.create({
    data: {
      userId: demoUser.id,
      name: 'Moderation Bot',
      description: 'A Discord bot with moderation commands',
      platform: Platform.DISCORD_NODE,
      language: Language.TYPESCRIPT,
      isPublic: true,
      commandPrefix: '!',
      files: {
        create: [
          {
            path: 'src/index.ts',
            content: `import { Client, GatewayIntentBits, Events } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(\`Ready! Logged in as \${c.user.tag}\`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  
  if (message.content.startsWith('!kick')) {
    // Kick command implementation
  }
});

client.login(process.env.DISCORD_TOKEN);`,
          },
          {
            path: 'package.json',
            content: JSON.stringify({
              name: 'moderation-bot',
              version: '1.0.0',
              main: 'dist/index.js',
              scripts: {
                build: 'tsc',
                start: 'node dist/index.js',
                dev: 'ts-node src/index.ts',
              },
              dependencies: {
                'discord.js': '^14.14.0',
              },
              devDependencies: {
                typescript: '^5.3.0',
                '@types/node': '^20.10.0',
                'ts-node': '^10.9.0',
              },
            }, null, 2),
          },
          {
            path: 'Dockerfile',
            content: `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]`,
          },
        ],
      },
    },
  });
  console.log('✅ Created Discord project:', discordProject.name);

  // Create community posts
  await prisma.communityPost.create({
    data: {
      userId: demoUser.id,
      projectId: minecraftProject.id,
      name: 'Teleport Plugin',
      description: 'A simple teleportation plugin for Minecraft servers with /tpa command support.',
      tags: ['minecraft', 'teleport', 'utility', 'paper'],
      screenshots: [],
      version: '1.0.0',
      license: 'MIT',
      downloads: 42,
      likesCount: 5,
    },
  });

  await prisma.communityPost.create({
    data: {
      userId: demoUser.id,
      projectId: discordProject.id,
      name: 'Moderation Bot',
      description: 'A powerful Discord moderation bot with kick, ban, and mute commands.',
      tags: ['discord', 'moderation', 'bot', 'typescript'],
      screenshots: [],
      version: '1.0.0',
      license: 'MIT',
      downloads: 128,
      likesCount: 23,
      isFeatured: true,
    },
  });
  console.log('✅ Created community posts');

  // Create sample documentation entries
  await prisma.docEntry.create({
    data: {
      title: 'Paper API - JavaPlugin',
      platform: Platform.MINECRAFT_PAPER,
      version: '1.20',
      content: `The JavaPlugin class is the base class for all Paper/Bukkit plugins.

Key methods:
- onEnable(): Called when the plugin is enabled
- onDisable(): Called when the plugin is disabled
- getConfig(): Returns the plugin configuration
- getLogger(): Returns the plugin logger
- getCommand(name): Gets a registered command

Example:
public class MyPlugin extends JavaPlugin {
    @Override
    public void onEnable() {
        getLogger().info("Plugin enabled!");
    }
}`,
      source: 'https://docs.papermc.io/paper/dev/api',
      isOfficial: true,
    },
  });

  await prisma.docEntry.create({
    data: {
      title: 'Discord.js - Client',
      platform: Platform.DISCORD_NODE,
      version: '14.x',
      content: `The Client class is the main hub for interacting with the Discord API.

Key properties:
- user: The logged in user
- guilds: A manager for all guilds the client is in
- channels: A manager for all channels

Key methods:
- login(token): Logs the client in
- destroy(): Logs out and terminates the connection

Events:
- ready: Emitted when the client becomes ready
- messageCreate: Emitted when a message is created

Example:
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.login(process.env.TOKEN);`,
      source: 'https://discord.js.org/docs/packages/discord.js/14.14.1/Client:Class',
      isOfficial: true,
    },
  });
  console.log('✅ Created documentation entries');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
