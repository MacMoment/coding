// Platform templates
export const PROJECT_TEMPLATES = {
  MINECRAFT_SPIGOT: [
    {
      id: 'spigot-basic',
      name: 'Basic Spigot Plugin',
      description: 'A simple Spigot plugin with command and listener examples',
      language: 'JAVA',
    },
    {
      id: 'spigot-economy',
      name: 'Economy Plugin',
      description: 'Plugin with Vault integration for economy features',
      language: 'JAVA',
    },
    {
      id: 'spigot-minigame',
      name: 'Minigame Plugin',
      description: 'Template for creating arena-based minigames',
      language: 'JAVA',
    },
  ],
  MINECRAFT_PAPER: [
    {
      id: 'paper-basic',
      name: 'Basic Paper Plugin',
      description: 'A simple Paper plugin with modern API usage',
      language: 'JAVA',
    },
    {
      id: 'paper-kotlin',
      name: 'Kotlin Paper Plugin',
      description: 'Paper plugin written in Kotlin with DSL features',
      language: 'KOTLIN',
    },
    {
      id: 'paper-gui',
      name: 'GUI Plugin',
      description: 'Plugin with inventory-based GUI system',
      language: 'JAVA',
    },
  ],
  MINECRAFT_FABRIC: [
    {
      id: 'fabric-basic',
      name: 'Basic Fabric Mod',
      description: 'A simple Fabric mod for Minecraft',
      language: 'JAVA',
    },
    {
      id: 'fabric-items',
      name: 'Custom Items Mod',
      description: 'Fabric mod with custom items and blocks',
      language: 'JAVA',
    },
  ],
  MINECRAFT_FORGE: [
    {
      id: 'forge-basic',
      name: 'Basic Forge Mod',
      description: 'A simple Forge mod for Minecraft',
      language: 'JAVA',
    },
    {
      id: 'forge-world',
      name: 'World Generation Mod',
      description: 'Forge mod with custom world generation',
      language: 'JAVA',
    },
  ],
  DISCORD_NODE: [
    {
      id: 'discord-node-basic',
      name: 'Basic Discord Bot',
      description: 'Simple Discord.js bot with slash commands',
      language: 'TYPESCRIPT',
    },
    {
      id: 'discord-node-moderation',
      name: 'Moderation Bot',
      description: 'Bot with kick, ban, mute and warning commands',
      language: 'TYPESCRIPT',
    },
    {
      id: 'discord-node-music',
      name: 'Music Bot',
      description: 'Music bot with queue and playback controls',
      language: 'TYPESCRIPT',
    },
    {
      id: 'discord-node-economy',
      name: 'Economy Bot',
      description: 'Bot with currency, shop, and inventory system',
      language: 'TYPESCRIPT',
    },
  ],
  DISCORD_PYTHON: [
    {
      id: 'discord-python-basic',
      name: 'Basic Discord Bot',
      description: 'Simple discord.py bot with cogs',
      language: 'PYTHON',
    },
    {
      id: 'discord-python-moderation',
      name: 'Moderation Bot',
      description: 'Bot with moderation and logging features',
      language: 'PYTHON',
    },
    {
      id: 'discord-python-utility',
      name: 'Utility Bot',
      description: 'Bot with various utility commands',
      language: 'PYTHON',
    },
  ],
} as const;

// API versions for platforms
export const API_VERSIONS = {
  MINECRAFT: ['1.21', '1.20.6', '1.20.4', '1.20.2', '1.20.1', '1.19.4', '1.18.2', '1.17.1', '1.16.5'],
  DISCORD_JS: ['14.14', '14.13', '14.12', '14.11', '14.10'],
  DISCORD_PY: ['2.3', '2.2', '2.1', '2.0'],
  FABRIC: ['0.15.0', '0.14.0', '0.13.0'],
  FORGE: ['49.0.0', '48.0.0', '47.0.0'],
} as const;

export type PlatformKey = keyof typeof PROJECT_TEMPLATES;
