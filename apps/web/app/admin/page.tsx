'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FolderOpen, Package, Coins, TrendingUp, Activity } from 'lucide-react';
import { api } from '@/lib/api';

interface DashboardStats {
  totals: {
    users: number;
    projects: number;
    posts: number;
    tokensUsed: number;
  };
  recentActivity: {
    newUsersThisWeek: number;
    postsThisMonth: number;
  };
  distributions: {
    usersByTier: { tier: string; count: number }[];
    usersByRole: { role: string; count: number }[];
    projectsByPlatform: { platform: string; count: number }[];
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAdminDashboard();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your platform statistics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totals.users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.recentActivity.newUsersThisWeek} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totals.projects.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Community Posts</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totals.posts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.recentActivity.postsThisMonth} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totals.tokensUsed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total consumption</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users by Tier */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Users by Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.distributions.usersByTier.map((item) => (
                <div key={item.tier} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.tier}</span>
                  <div className="flex items-center">
                    <div className="w-32 h-2 bg-muted rounded-full mr-3">
                      <div
                        className="h-2 bg-primary rounded-full"
                        style={{
                          width: `${(item.count / (stats?.totals.users || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Users by Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.distributions.usersByRole.map((item) => (
                <div key={item.role} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.role}</span>
                  <div className="flex items-center">
                    <div className="w-32 h-2 bg-muted rounded-full mr-3">
                      <div
                        className="h-2 bg-primary rounded-full"
                        style={{
                          width: `${(item.count / (stats?.totals.users || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Projects by Platform */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Projects by Platform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.distributions.projectsByPlatform.map((item) => (
                <div key={item.platform} className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {item.platform.replace('_', ' ')}
                  </span>
                  <div className="flex items-center">
                    <div className="w-24 h-2 bg-muted rounded-full mr-3">
                      <div
                        className="h-2 bg-primary rounded-full"
                        style={{
                          width: `${(item.count / (stats?.totals.projects || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
