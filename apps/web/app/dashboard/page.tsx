'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Plus,
  FolderOpen,
  Clock,
  Code2,
  Bot,
  Loader2,
  Coins,
  Gift,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading, checkAuth, updateTokenBalance } = useAuthStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingTokens, setClaimingTokens] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    if (isAuthenticated) {
      loadProjects();
    }
  }, [authLoading, isAuthenticated, router]);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data.items);
    } catch (error) {
      console.error('Failed to load projects', error);
    } finally {
      setIsLoading(false);
    }
  };

  const claimDailyTokens = async () => {
    setClaimingTokens(true);
    try {
      const result = await api.claimDailyTokens();
      updateTokenBalance(result.newBalance);
      toast({
        title: 'Tokens claimed!',
        description: `You received ${result.tokensAdded} tokens.`,
      });
    } catch (error: any) {
      toast({
        title: 'Claim failed',
        description: error.message || 'Could not claim tokens. Try again later.',
        variant: 'destructive',
      });
    } finally {
      setClaimingTokens(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">ForgeCraft AI</span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link href="/community" className="text-sm font-medium hover:text-primary">
              Community
            </Link>
            <Link href="/docs" className="text-sm font-medium hover:text-primary">
              Docs
            </Link>
            <Link href="/pricing" className="text-sm font-medium hover:text-primary">
              Pricing
            </Link>
            <div className="flex items-center space-x-2 bg-muted rounded-full px-4 py-2">
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-medium">{user?.tokenBalance || 0}</span>
            </div>
            <Button variant="outline" size="sm" onClick={claimDailyTokens} disabled={claimingTokens}>
              {claimingTokens ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  Claim Daily
                </>
              )}
            </Button>
            {user?.role === 'ADMIN' && (
              <Link href="/admin">
                <Button variant="ghost" size="icon" title="Admin Panel">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container py-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.displayName}!</h1>
            <p className="text-muted-foreground mt-1">
              {user?.subscriptionTier} tier • {user?.tokenBalance} tokens available
            </p>
          </div>
          <Link href="/projects/new">
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => router.push('/projects/new?platform=MINECRAFT_PAPER')}>
            <CardHeader className="flex flex-row items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Minecraft Plugin</CardTitle>
                <CardDescription>Spigot, Paper, Fabric, or Forge</CardDescription>
              </div>
            </CardHeader>
          </Card>
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => router.push('/projects/new?platform=DISCORD_NODE')}>
            <CardHeader className="flex flex-row items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Discord Bot</CardTitle>
                <CardDescription>JavaScript or Python</CardDescription>
              </div>
            </CardHeader>
          </Card>
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => router.push('/community')}>
            <CardHeader className="flex flex-row items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Browse Gallery</CardTitle>
                <CardDescription>Discover community projects</CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Projects List */}
        <div>
          <h2 className="text-xl font-bold mb-4">Your Projects</h2>
          {projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-4">Create your first project to get started</p>
                <Link href="/projects/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:bg-accent/50 transition-colors h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {project.platform.startsWith('MINECRAFT') ? (
                            <Code2 className="h-5 w-5 text-primary" />
                          ) : (
                            <Bot className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {project.platform.replace('_', ' ')}
                        </span>
                      </div>
                      <CardTitle className="mt-4">{project.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(project.updatedAt).toLocaleDateString()}
                        <span className="mx-2">•</span>
                        {project._count?.files || 0} files
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
