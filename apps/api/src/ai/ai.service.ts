import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_MODELS, sanitizePrompt } from '@forgecraft/shared';

export interface GenerateCodeParams {
  provider: string;
  model: string;
  prompt: string;
  platform: string;
  language: string;
  context?: {
    existingFiles?: Record<string, string>;
    docs?: string[];
    apiVersion?: string;
    packageName?: string;
    commandPrefix?: string;
  };
}

export interface GeneratedOutput {
  files: Record<string, string>;
  summary: string;
  tokensUsed: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('MEGALLM_API_KEY', '');
    this.apiUrl = this.configService.get('MEGALLM_API_URL', 'https://api.megallm.com/v1');
  }

  async generateCode(params: GenerateCodeParams): Promise<GeneratedOutput> {
    const { provider, model, prompt, platform, language, context } = params;

    // Sanitize input
    const sanitizedPrompt = sanitizePrompt(prompt);

    // Build system prompt based on platform
    const systemPrompt = this.buildSystemPrompt(platform, language, context);

    // Build user prompt with context
    const userPrompt = this.buildUserPrompt(sanitizedPrompt, context);

    this.logger.log(`Generating code with model: ${model} for platform: ${platform}`);

    try {
      // Get model configuration
      const modelConfig = AI_MODELS[model as keyof typeof AI_MODELS];
      if (!modelConfig) {
        throw new Error(`Unknown model: ${model}`);
      }

      // Call MegaLLM API
      const response = await this.callMegaLLM({
        model: modelConfig.id,
        systemPrompt,
        userPrompt,
        maxTokens: modelConfig.maxOutputTokens,
      });

      // Parse the response
      const output = this.parseGeneratedOutput(response);

      return output;
    } catch (error) {
      this.logger.error(`Generation failed: ${error}`);
      throw error;
    }
  }

  private buildSystemPrompt(platform: string, language: string, context?: any): string {
    const basePrompts: Record<string, string> = {
      MINECRAFT_PAPER: `You are an expert Minecraft plugin developer for Paper API.
You must generate complete, working Java code that follows these requirements:
- Use proper package naming (${context?.packageName || 'com.example.plugin'})
- Include plugin.yml with correct format
- Target API version ${context?.apiVersion || '1.20'}
- Use modern Paper API practices
- Include proper command and listener registration
- Add meaningful comments
- Must compile under Gradle with Java 17`,

      MINECRAFT_SPIGOT: `You are an expert Minecraft plugin developer for Spigot API.
You must generate complete, working Java code that follows these requirements:
- Use proper package naming (${context?.packageName || 'com.example.plugin'})
- Include plugin.yml with correct format
- Target API version ${context?.apiVersion || '1.20'}
- Use Spigot API best practices
- Include proper command and event handling
- Must compile under Maven with Java 17`,

      MINECRAFT_FABRIC: `You are an expert Minecraft mod developer for Fabric.
You must generate complete, working Java code that follows these requirements:
- Use proper package naming (${context?.packageName || 'com.example.mod'})
- Include fabric.mod.json with correct format
- Target Minecraft ${context?.apiVersion || '1.20'}
- Use Fabric API conventions
- Include proper mod initialization
- Must compile under Gradle`,

      MINECRAFT_FORGE: `You are an expert Minecraft mod developer for Forge.
You must generate complete, working Java code that follows these requirements:
- Use proper package naming (${context?.packageName || 'com.example.mod'})
- Include mods.toml with correct format
- Target Minecraft ${context?.apiVersion || '1.20'}
- Use Forge conventions and annotations
- Must compile under Gradle`,

      DISCORD_NODE: `You are an expert Discord bot developer using Discord.js v14.
You must generate complete, working TypeScript code that follows these requirements:
- Use Discord.js v14 with proper intents
- Command prefix: ${context?.commandPrefix || '!'}
- Include proper slash command registration
- Handle permissions correctly
- Include Dockerfile for deployment
- Use modern async/await patterns
- Include proper error handling`,

      DISCORD_PYTHON: `You are an expert Discord bot developer using discord.py.
You must generate complete, working Python code that follows these requirements:
- Use discord.py 2.x with proper intents
- Command prefix: ${context?.commandPrefix || '!'}
- Use cogs for organization
- Include proper slash command support
- Include requirements.txt
- Include Dockerfile for deployment
- Use async/await properly`,
    };

    return basePrompts[platform] || basePrompts.MINECRAFT_PAPER;
  }

  private buildUserPrompt(prompt: string, context?: any): string {
    let userPrompt = `Generate the following:

${prompt}

Requirements:
1. Generate a complete folder structure
2. Include all necessary files with full content
3. Include build configuration (build.gradle, package.json, etc.)
4. Include README.md with setup instructions
5. Include example usage
6. Make the code production-ready

`;

    if (context?.existingFiles && Object.keys(context.existingFiles).length > 0) {
      userPrompt += `\nExisting project files for reference:\n`;
      for (const [path, content] of Object.entries(context.existingFiles)) {
        userPrompt += `\n--- ${path} ---\n${content}\n`;
      }
    }

    if (context?.docs && context.docs.length > 0) {
      userPrompt += `\nRelevant documentation:\n`;
      context.docs.forEach((doc: string) => {
        userPrompt += `\n${doc}\n`;
      });
    }

    userPrompt += `
Output format - respond with a JSON object containing:
{
  "files": {
    "path/to/file.ext": "file content here",
    ...
  },
  "summary": "Brief description of what was generated"
}`;

    return userPrompt;
  }

  private async callMegaLLM(params: {
    model: string;
    systemPrompt: string;
    userPrompt: string;
    maxTokens: number;
  }): Promise<any> {
    // For now, return mock data since we don't have actual API access
    // In production, this would call the actual MegaLLM API
    
    if (!this.apiKey) {
      this.logger.warn('MegaLLM API key not configured, returning mock response');
      return this.getMockResponse(params.userPrompt);
    }

    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: params.model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt },
        ],
        max_tokens: params.maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`MegaLLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }

  private getMockResponse(prompt: string): any {
    // Return a mock response for testing
    if (prompt.toLowerCase().includes('discord')) {
      return {
        files: {
          'src/index.ts': `import { Client, GatewayIntentBits, Events } from 'discord.js';

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

client.login(process.env.DISCORD_TOKEN);`,
          'package.json': JSON.stringify({
            name: 'discord-bot',
            version: '1.0.0',
            main: 'dist/index.js',
            scripts: {
              build: 'tsc',
              start: 'node dist/index.js',
            },
            dependencies: {
              'discord.js': '^14.14.0',
            },
            devDependencies: {
              typescript: '^5.3.0',
            },
          }, null, 2),
          'tsconfig.json': JSON.stringify({
            compilerOptions: {
              target: 'ES2020',
              module: 'commonjs',
              outDir: './dist',
              strict: true,
            },
            include: ['src/**/*'],
          }, null, 2),
          'Dockerfile': `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]`,
          'README.md': `# Discord Bot

## Setup
1. Install dependencies: \`npm install\`
2. Set DISCORD_TOKEN environment variable
3. Build: \`npm run build\`
4. Run: \`npm start\``,
        },
        summary: 'Generated a basic Discord.js bot with TypeScript',
        tokensUsed: 1500,
      };
    }

    // Minecraft plugin mock
    return {
      files: {
        'src/main/java/com/example/plugin/MainPlugin.java': `package com.example.plugin;

import org.bukkit.plugin.java.JavaPlugin;

public class MainPlugin extends JavaPlugin {
    @Override
    public void onEnable() {
        getLogger().info("Plugin enabled!");
    }

    @Override
    public void onDisable() {
        getLogger().info("Plugin disabled!");
    }
}`,
        'src/main/resources/plugin.yml': `name: MyPlugin
version: 1.0.0
main: com.example.plugin.MainPlugin
api-version: '1.20'
description: A generated Minecraft plugin`,
        'build.gradle': `plugins {
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
        'README.md': `# Minecraft Plugin

## Setup
1. Build with: \`./gradlew build\`
2. Copy jar from build/libs to server plugins folder
3. Restart server`,
      },
      summary: 'Generated a basic Paper plugin structure',
      tokensUsed: 1200,
    };
  }

  private parseGeneratedOutput(response: any): GeneratedOutput {
    if (typeof response === 'string') {
      try {
        response = JSON.parse(response);
      } catch {
        throw new Error('Invalid response format from AI');
      }
    }

    return {
      files: response.files || {},
      summary: response.summary || 'Code generated successfully',
      tokensUsed: response.tokensUsed || 1000,
    };
  }
}
