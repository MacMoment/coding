'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Code2,
  Bot,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const platforms = [
  {
    id: 'MINECRAFT_PAPER',
    name: 'Paper Plugin',
    description: 'Modern Minecraft server plugin',
    icon: Code2,
    languages: [
      { id: 'JAVA', name: 'Java' },
      { id: 'KOTLIN', name: 'Kotlin' },
    ],
  },
  {
    id: 'MINECRAFT_SPIGOT',
    name: 'Spigot Plugin',
    description: 'Classic Bukkit/Spigot plugin',
    icon: Code2,
    languages: [{ id: 'JAVA', name: 'Java' }],
  },
  {
    id: 'MINECRAFT_FABRIC',
    name: 'Fabric Mod',
    description: 'Lightweight Minecraft mod',
    icon: Code2,
    languages: [{ id: 'JAVA', name: 'Java' }],
  },
  {
    id: 'MINECRAFT_FORGE',
    name: 'Forge Mod',
    description: 'Traditional Minecraft mod',
    icon: Code2,
    languages: [{ id: 'JAVA', name: 'Java' }],
  },
  {
    id: 'DISCORD_NODE',
    name: 'Discord.js Bot',
    description: 'Node.js Discord bot',
    icon: Bot,
    languages: [
      { id: 'TYPESCRIPT', name: 'TypeScript' },
      { id: 'JAVASCRIPT', name: 'JavaScript' },
    ],
  },
  {
    id: 'DISCORD_PYTHON',
    name: 'discord.py Bot',
    description: 'Python Discord bot',
    icon: Bot,
    languages: [{ id: 'PYTHON', name: 'Python' }],
  },
];

const templates = {
  MINECRAFT_PAPER: [
    { id: 'paper-basic', name: 'Basic Plugin', description: 'Simple plugin with commands' },
    { id: 'paper-gui', name: 'GUI Plugin', description: 'Plugin with inventory menus' },
    { id: 'paper-economy', name: 'Economy Plugin', description: 'Plugin with Vault integration' },
  ],
  MINECRAFT_SPIGOT: [
    { id: 'spigot-basic', name: 'Basic Plugin', description: 'Simple Spigot plugin' },
    { id: 'spigot-minigame', name: 'Minigame', description: 'Arena-based minigame' },
  ],
  MINECRAFT_FABRIC: [
    { id: 'fabric-basic', name: 'Basic Mod', description: 'Simple Fabric mod' },
    { id: 'fabric-items', name: 'Items Mod', description: 'Custom items and blocks' },
  ],
  MINECRAFT_FORGE: [
    { id: 'forge-basic', name: 'Basic Mod', description: 'Simple Forge mod' },
  ],
  DISCORD_NODE: [
    { id: 'discord-node-basic', name: 'Basic Bot', description: 'Simple slash command bot' },
    { id: 'discord-node-moderation', name: 'Moderation Bot', description: 'Kick, ban, mute commands' },
    { id: 'discord-node-music', name: 'Music Bot', description: 'Music playback bot' },
  ],
  DISCORD_PYTHON: [
    { id: 'discord-python-basic', name: 'Basic Bot', description: 'Simple cog-based bot' },
    { id: 'discord-python-moderation', name: 'Moderation Bot', description: 'Moderation features' },
  ],
};

const models = [
  { id: 'CLAUDE_SONNET_4_5', name: 'Claude Sonnet 4.5', description: 'Fast and capable', tier: 'STARTER' },
  { id: 'GPT_5', name: 'GPT-5', description: 'Versatile', tier: 'PRO' },
  { id: 'GEMINI_3_PRO', name: 'Gemini 3 Pro', description: 'Long context', tier: 'PRO' },
  { id: 'GROK_4_1_FAST', name: 'Grok 4.1 Fast', description: 'Budget-friendly', tier: 'FREE' },
  { id: 'CLAUDE_OPUS_4_5', name: 'Claude Opus 4.5', description: 'Most capable', tier: 'ELITE' },
];

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [platform, setPlatform] = useState(searchParams.get('platform') || '');
  const [language, setLanguage] = useState('');
  const [template, setTemplate] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('GROK_4_1_FAST');

  // Platform-specific settings
  const [apiVersion, setApiVersion] = useState('1.20');
  const [packageName, setPackageName] = useState('com.example.plugin');
  const [commandPrefix, setCommandPrefix] = useState('!');

  const selectedPlatform = platforms.find((p) => p.id === platform);
  const availableTemplates = templates[platform as keyof typeof templates] || [];

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a project name',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const project = await api.createProject({
        name,
        description,
        platform,
        language,
        template,
        apiVersion: platform.startsWith('MINECRAFT') ? apiVersion : undefined,
        packageName: platform.startsWith('MINECRAFT') ? packageName : undefined,
        commandPrefix: platform.startsWith('DISCORD') ? commandPrefix : undefined,
      });

      // If prompt is provided, generate code
      if (prompt.trim()) {
        await api.generateCode(project.id, {
          prompt,
          model,
        });
        toast({
          title: 'Project created!',
          description: 'AI is generating your code. This may take a moment.',
        });
      } else {
        toast({
          title: 'Project created!',
          description: 'Your project is ready.',
        });
      }

      router.push(`/projects/${project.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create project',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">ForgeCraft AI</span>
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground mt-1">
            Step {step} of 4 - {step === 1 ? 'Choose Platform' : step === 2 ? 'Select Template' : step === 3 ? 'Project Details' : 'Generate Code'}
          </p>
        </div>

        {/* Progress */}
        <div className="flex mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  s < step
                    ? 'bg-primary text-primary-foreground'
                    : s === step
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {s < step ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
              {s < 4 && (
                <div className={`w-16 h-1 ${s < step ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Platform */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Choose a Platform</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platforms.map((p) => (
                <Card
                  key={p.id}
                  className={`cursor-pointer transition-colors ${
                    platform === p.id ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                  }`}
                  onClick={() => {
                    setPlatform(p.id);
                    setLanguage(p.languages[0].id);
                  }}
                >
                  <CardHeader className="flex flex-row items-center space-x-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{p.name}</CardTitle>
                      <CardDescription>{p.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setStep(2)} disabled={!platform}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Template & Language */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Select a Template</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableTemplates.map((t) => (
                  <Card
                    key={t.id}
                    className={`cursor-pointer transition-colors ${
                      template === t.id ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setTemplate(t.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{t.name}</CardTitle>
                      <CardDescription>{t.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
                <Card
                  className={`cursor-pointer transition-colors ${
                    template === '' ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                  }`}
                  onClick={() => setTemplate('')}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">Empty Project</CardTitle>
                    <CardDescription>Start from scratch</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>

            {selectedPlatform && selectedPlatform.languages.length > 1 && (
              <div>
                <Label>Language</Label>
                <div className="flex gap-2 mt-2">
                  {selectedPlatform.languages.map((lang) => (
                    <Button
                      key={lang.id}
                      variant={language === lang.id ? 'default' : 'outline'}
                      onClick={() => setLanguage(lang.id)}
                    >
                      {lang.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Project Details */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Project Details</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome Project"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of your project"
                />
              </div>

              {platform.startsWith('MINECRAFT') && (
                <>
                  <div>
                    <Label htmlFor="apiVersion">API Version</Label>
                    <select
                      id="apiVersion"
                      value={apiVersion}
                      onChange={(e) => setApiVersion(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border bg-background"
                    >
                      <option value="1.21">1.21</option>
                      <option value="1.20.6">1.20.6</option>
                      <option value="1.20.4">1.20.4</option>
                      <option value="1.20">1.20</option>
                      <option value="1.19.4">1.19.4</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="packageName">Package Name</Label>
                    <Input
                      id="packageName"
                      value={packageName}
                      onChange={(e) => setPackageName(e.target.value)}
                      placeholder="com.example.plugin"
                    />
                  </div>
                </>
              )}

              {platform.startsWith('DISCORD') && (
                <div>
                  <Label htmlFor="commandPrefix">Command Prefix</Label>
                  <Input
                    id="commandPrefix"
                    value={commandPrefix}
                    onChange={(e) => setCommandPrefix(e.target.value)}
                    placeholder="!"
                    maxLength={5}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep(4)} disabled={!name.trim()}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: AI Generation */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">What should we build?</h2>

            <div>
              <Label htmlFor="prompt">Describe your project (optional)</Label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Build a teleportation plugin that lets players send teleport requests to each other with /tpa..."
                className="w-full h-32 px-3 py-2 rounded-md border bg-background resize-none"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Leave empty to create a project with just the template structure
              </p>
            </div>

            <div>
              <Label>AI Model</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {models.map((m) => (
                  <Card
                    key={m.id}
                    className={`cursor-pointer transition-colors ${
                      model === m.id ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setModel(m.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{m.name}</div>
                          <div className="text-sm text-muted-foreground">{m.description}</div>
                        </div>
                        <span className="text-xs bg-muted px-2 py-1 rounded">{m.tier}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleCreate} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Project
                    <Sparkles className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
