const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
    }
  }

  getToken() {
    return this.token;
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (this.token) {
      requestHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async signUp(data: { email: string; password: string; displayName?: string; referralCode?: string }) {
    const result = await this.request<{ user: any; accessToken: string }>('/auth/signup', {
      method: 'POST',
      body: data,
    });
    this.setToken(result.accessToken);
    return result;
  }

  async signIn(data: { email: string; password: string }) {
    const result = await this.request<{ user: any; accessToken: string }>('/auth/signin', {
      method: 'POST',
      body: data,
    });
    this.setToken(result.accessToken);
    return result;
  }

  async signOut() {
    try {
      await this.request('/auth/signout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  // Projects
  async getProjects(page = 1, limit = 20) {
    return this.request<any>(`/projects?page=${page}&limit=${limit}`);
  }

  async getProject(id: string) {
    return this.request<any>(`/projects/${id}`);
  }

  async createProject(data: any) {
    return this.request<any>('/projects', { method: 'POST', body: data });
  }

  async updateProject(id: string, data: any) {
    return this.request<any>(`/projects/${id}`, { method: 'PUT', body: data });
  }

  async deleteProject(id: string) {
    return this.request<any>(`/projects/${id}`, { method: 'DELETE' });
  }

  async generateCode(projectId: string, data: { prompt: string; model: string; context?: any }) {
    return this.request<any>(`/projects/${projectId}/generate`, { method: 'POST', body: data });
  }

  async getGenerationJob(projectId: string, jobId: string) {
    return this.request<any>(`/projects/${projectId}/jobs/${jobId}`);
  }

  async createFile(projectId: string, data: { path: string; content?: string; isDirectory?: boolean }) {
    return this.request<any>(`/projects/${projectId}/files`, { method: 'POST', body: data });
  }

  async updateFile(projectId: string, fileId: string, data: { content: string }) {
    return this.request<any>(`/projects/${projectId}/files/${fileId}`, { method: 'PUT', body: data });
  }

  async deleteFile(projectId: string, fileId: string) {
    return this.request<any>(`/projects/${projectId}/files/${fileId}`, { method: 'DELETE' });
  }

  async createCheckpoint(projectId: string, summary: string) {
    return this.request<any>(`/projects/${projectId}/checkpoints`, { method: 'POST', body: { summary } });
  }

  async getCheckpoints(projectId: string, page = 1, limit = 20) {
    return this.request<any>(`/projects/${projectId}/checkpoints?page=${page}&limit=${limit}`);
  }

  async restoreCheckpoint(projectId: string, checkpointId: string) {
    return this.request<any>(`/projects/${projectId}/restore-checkpoint`, {
      method: 'POST',
      body: { checkpointId },
    });
  }

  async buildProject(projectId: string) {
    return this.request<any>(`/projects/${projectId}/build`, { method: 'POST' });
  }

  // Tokens
  async getTokenBalance() {
    return this.request<{ balance: number; tier: string }>('/tokens/balance');
  }

  async getTokenHistory(page = 1, limit = 20) {
    return this.request<any>(`/tokens/history?page=${page}&limit=${limit}`);
  }

  async claimDailyTokens() {
    return this.request<any>('/tokens/claim-daily', { method: 'POST' });
  }

  // Billing
  async getPlans() {
    return this.request<any[]>('/billing/plans');
  }

  async getTokenPacks() {
    return this.request<any[]>('/billing/token-packs');
  }

  async createCheckout(tier: string) {
    return this.request<{ sessionId: string; url: string }>('/billing/checkout', {
      method: 'POST',
      body: { tier },
    });
  }

  async createTokenPackCheckout(packId: string) {
    return this.request<{ sessionId: string; url: string }>('/billing/token-pack', {
      method: 'POST',
      body: { packId },
    });
  }

  async getBillingPortal() {
    return this.request<{ url: string }>('/billing/portal');
  }

  // Community
  async getCommunityGallery(params?: {
    page?: number;
    limit?: number;
    platform?: string;
    tags?: string;
    featured?: boolean;
    search?: string;
    sort?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(key, String(value));
        }
      });
    }
    return this.request<any>(`/community?${searchParams.toString()}`);
  }

  async getCommunityPost(postId: string) {
    return this.request<any>(`/community/${postId}`);
  }

  async publishProject(data: any) {
    return this.request<any>('/community/publish', { method: 'POST', body: data });
  }

  async likePost(postId: string) {
    return this.request<{ liked: boolean }>(`/community/${postId}/like`, { method: 'POST' });
  }

  async addComment(postId: string, content: string) {
    return this.request<any>(`/community/${postId}/comment`, { method: 'POST', body: { content } });
  }

  async downloadProject(postId: string) {
    return this.request<any>(`/community/${postId}/download`);
  }

  // Deployments
  async createDeployment(data: { projectId: string; region?: string; secrets?: Record<string, string> }) {
    return this.request<any>('/deployments', { method: 'POST', body: data });
  }

  async getDeployments(projectId?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (projectId) params.set('projectId', projectId);
    return this.request<any>(`/deployments?${params.toString()}`);
  }

  async getDeployment(id: string) {
    return this.request<any>(`/deployments/${id}`);
  }

  async stopDeployment(id: string) {
    return this.request<any>(`/deployments/${id}/stop`, { method: 'POST' });
  }

  async restartDeployment(id: string) {
    return this.request<any>(`/deployments/${id}/restart`, { method: 'POST' });
  }

  async getDeploymentLogs(id: string, page = 1, limit = 100) {
    return this.request<any>(`/deployments/${id}/logs?page=${page}&limit=${limit}`);
  }

  // Docs
  async searchDocs(query: string, platform?: string, version?: string) {
    const params = new URLSearchParams({ q: query });
    if (platform) params.set('platform', platform);
    if (version) params.set('version', version);
    return this.request<any>(`/docs/search?${params.toString()}`);
  }

  async getDocsStats() {
    return this.request<any>('/docs/stats');
  }

  // Admin - Dashboard
  async getAdminDashboard() {
    return this.request<any>('/admin/dashboard');
  }

  // Admin - Users
  async getAdminUsers(page = 1, limit = 20, search?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    return this.request<any>(`/admin/users?${params.toString()}`);
  }

  async getAdminUser(userId: string) {
    return this.request<any>(`/admin/users/${userId}`);
  }

  async updateUserRole(userId: string, role: string) {
    return this.request<any>(`/admin/users/${userId}/role`, { method: 'PUT', body: { role } });
  }

  async adjustUserTokens(userId: string, amount: number, reason?: string) {
    return this.request<any>(`/admin/users/${userId}/tokens`, { method: 'POST', body: { amount, reason } });
  }

  async updateUserTier(userId: string, tier: string) {
    return this.request<any>(`/admin/users/${userId}/tier`, { method: 'PUT', body: { tier } });
  }

  async deleteAdminUser(userId: string) {
    return this.request<any>(`/admin/users/${userId}`, { method: 'DELETE' });
  }

  // Admin - Products
  async getAdminProducts(page = 1, limit = 20, search?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    return this.request<any>(`/admin/products?${params.toString()}`);
  }

  async updateAdminProduct(productId: string, data: any) {
    return this.request<any>(`/admin/products/${productId}`, { method: 'PUT', body: data });
  }

  async deleteAdminProduct(productId: string) {
    return this.request<any>(`/admin/products/${productId}`, { method: 'DELETE' });
  }

  // Admin - Categories
  async getAdminCategories() {
    return this.request<any[]>('/admin/categories');
  }

  async createAdminCategory(data: { name: string; order?: number }) {
    return this.request<any>('/admin/categories', { method: 'POST', body: data });
  }

  async updateAdminCategory(categoryId: string, data: { name?: string; order?: number }) {
    return this.request<any>(`/admin/categories/${categoryId}`, { method: 'PUT', body: data });
  }

  async deleteAdminCategory(categoryId: string) {
    return this.request<any>(`/admin/categories/${categoryId}`, { method: 'DELETE' });
  }

  async reorderAdminCategories(ids: string[]) {
    return this.request<any>('/admin/categories/reorder', { method: 'POST', body: { ids } });
  }

  // Admin - Portfolio
  async getAdminPortfolio() {
    return this.request<any[]>('/admin/portfolio');
  }

  async createAdminPortfolioItem(data: { title: string; description?: string; imageUrl: string; gridSize?: number; order?: number }) {
    return this.request<any>('/admin/portfolio', { method: 'POST', body: data });
  }

  async updateAdminPortfolioItem(itemId: string, data: any) {
    return this.request<any>(`/admin/portfolio/${itemId}`, { method: 'PUT', body: data });
  }

  async deleteAdminPortfolioItem(itemId: string) {
    return this.request<any>(`/admin/portfolio/${itemId}`, { method: 'DELETE' });
  }

  async reorderAdminPortfolio(ids: string[]) {
    return this.request<any>('/admin/portfolio/reorder', { method: 'POST', body: { ids } });
  }

  // Admin - Reports
  async getAdminReports(page = 1, limit = 20) {
    return this.request<any>(`/admin/reports?page=${page}&limit=${limit}`);
  }

  async resolveAdminReport(reportId: string, status: 'RESOLVED' | 'DISMISSED') {
    return this.request<any>(`/admin/reports/${reportId}`, { method: 'PUT', body: { status } });
  }
}

export const api = new ApiClient(API_URL);
