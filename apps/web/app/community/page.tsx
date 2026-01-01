'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Search, Heart, Download, Code2, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState<string>('');
  const [sort, setSort] = useState<string>('recent');

  useEffect(() => {
    loadPosts();
  }, [platform, sort]);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCommunityGallery({
        platform: platform || undefined,
        sort: sort as any,
        search: search || undefined,
      });
      setPosts(data.items);
    } catch (error) {
      console.error('Failed to load posts', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPosts();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">ForgeCraft AI</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/pricing" className="text-sm font-medium hover:text-primary">
              Pricing
            </Link>
            <Link href="/docs" className="text-sm font-medium hover:text-primary">
              Docs
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tighter">Community Gallery</h1>
          <p className="mt-4 text-muted-foreground">
            Discover and download Minecraft plugins and Discord bots created by the community
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
          <div className="flex gap-2">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="px-3 py-2 rounded-md border bg-background"
            >
              <option value="">All Platforms</option>
              <option value="MINECRAFT_PAPER">Minecraft - Paper</option>
              <option value="MINECRAFT_SPIGOT">Minecraft - Spigot</option>
              <option value="MINECRAFT_FABRIC">Minecraft - Fabric</option>
              <option value="DISCORD_NODE">Discord - Node.js</option>
              <option value="DISCORD_PYTHON">Discord - Python</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded-md border bg-background"
            >
              <option value="recent">Most Recent</option>
              <option value="downloads">Most Downloads</option>
              <option value="likes">Most Liked</option>
            </select>
          </div>
        </div>

        {/* Posts Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No projects found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/community/${post.id}`}>
                <Card className="h-full hover:bg-accent/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {post.project?.platform?.startsWith('MINECRAFT') ? (
                          <Code2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Bot className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      {post.isFeatured && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                    <CardTitle className="line-clamp-1">{post.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {post.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags?.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="text-xs bg-muted px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          {post.likesCount}
                        </span>
                        <span className="flex items-center">
                          <Download className="h-4 w-4 mr-1" />
                          {post.downloads}
                        </span>
                      </div>
                      <span>by {post.user?.displayName}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-12 mt-16">
        <div className="container flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-bold">ForgeCraft AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 ForgeCraft AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
