'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Shield,
  Coins,
  Crown,
  Trash2,
  Loader2,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatar: string | null;
  role: string;
  subscriptionTier: string;
  tokenBalance: number;
  emailVerified: boolean;
  createdAt: string;
  _count: {
    projects: number;
    communityPosts: number;
  };
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'role' | 'tokens' | 'tier' | 'delete' | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form state
  const [newRole, setNewRole] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [tokenReason, setTokenReason] = useState('');
  const [newTier, setNewTier] = useState('');

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAdminUsers(page, 20, search || undefined);
      setUsers(data.items);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const openModal = (user: User, type: 'role' | 'tokens' | 'tier' | 'delete') => {
    setSelectedUser(user);
    setModalType(type);
    setActionMenu(null);
    if (type === 'role') setNewRole(user.role);
    if (type === 'tier') setNewTier(user.subscriptionTier);
    if (type === 'tokens') {
      setTokenAmount('');
      setTokenReason('');
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalType(null);
    setNewRole('');
    setTokenAmount('');
    setTokenReason('');
    setNewTier('');
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;
    setModalLoading(true);
    try {
      await api.updateUserRole(selectedUser.id, newRole);
      toast({ title: 'Success', description: 'User role updated' });
      closeModal();
      loadUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleAdjustTokens = async () => {
    if (!selectedUser || !tokenAmount) return;
    setModalLoading(true);
    try {
      await api.adjustUserTokens(selectedUser.id, parseInt(tokenAmount), tokenReason || undefined);
      toast({ title: 'Success', description: 'Token balance adjusted' });
      closeModal();
      loadUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateTier = async () => {
    if (!selectedUser || !newTier) return;
    setModalLoading(true);
    try {
      await api.updateUserTier(selectedUser.id, newTier);
      toast({ title: 'Success', description: 'Subscription tier updated' });
      closeModal();
      loadUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setModalLoading(true);
    try {
      await api.deleteAdminUser(selectedUser.id);
      toast({ title: 'Success', description: 'User deleted' });
      closeModal();
      loadUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">Manage user accounts, roles, and permissions</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">User</th>
                    <th className="text-left p-4 font-medium">Role</th>
                    <th className="text-left p-4 font-medium">Tier</th>
                    <th className="text-left p-4 font-medium">Tokens</th>
                    <th className="text-left p-4 font-medium">Projects</th>
                    <th className="text-left p-4 font-medium">Joined</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/30">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{user.displayName}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            user.role === 'ADMIN'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              : user.role === 'MODERATOR'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{user.subscriptionTier}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{user.tokenBalance.toLocaleString()}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{user._count.projects}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setActionMenu(actionMenu === user.id ? null : user.id)}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          {actionMenu === user.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-card border rounded-md shadow-lg z-10">
                              <button
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center"
                                onClick={() => openModal(user, 'role')}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Change Role
                              </button>
                              <button
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center"
                                onClick={() => openModal(user, 'tokens')}
                              >
                                <Coins className="h-4 w-4 mr-2" />
                                Adjust Tokens
                              </button>
                              <button
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center"
                                onClick={() => openModal(user, 'tier')}
                              >
                                <Crown className="h-4 w-4 mr-2" />
                                Change Tier
                              </button>
                              {user.role !== 'ADMIN' && (
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center text-destructive"
                                  onClick={() => openModal(user, 'delete')}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Modals */}
      {modalType && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-card border rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {modalType === 'role' && (
              <>
                <h2 className="text-xl font-bold mb-4">Change User Role</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Changing role for: {selectedUser.displayName}
                </p>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full p-2 border rounded mb-4 bg-background"
                >
                  <option value="USER">User</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={closeModal}>Cancel</Button>
                  <Button onClick={handleUpdateRole} disabled={modalLoading}>
                    {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </Button>
                </div>
              </>
            )}

            {modalType === 'tokens' && (
              <>
                <h2 className="text-xl font-bold mb-4">Adjust Token Balance</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Current balance: {selectedUser.tokenBalance.toLocaleString()} tokens
                </p>
                <Input
                  type="number"
                  placeholder="Amount (positive to add, negative to deduct)"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  className="mb-2"
                />
                <Input
                  placeholder="Reason (optional)"
                  value={tokenReason}
                  onChange={(e) => setTokenReason(e.target.value)}
                  className="mb-4"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={closeModal}>Cancel</Button>
                  <Button onClick={handleAdjustTokens} disabled={modalLoading || !tokenAmount}>
                    {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Adjust'}
                  </Button>
                </div>
              </>
            )}

            {modalType === 'tier' && (
              <>
                <h2 className="text-xl font-bold mb-4">Change Subscription Tier</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Changing tier for: {selectedUser.displayName}
                </p>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value)}
                  className="w-full p-2 border rounded mb-4 bg-background"
                >
                  <option value="FREE">Free</option>
                  <option value="STARTER">Starter</option>
                  <option value="PRO">Pro</option>
                  <option value="ELITE">Elite</option>
                </select>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={closeModal}>Cancel</Button>
                  <Button onClick={handleUpdateTier} disabled={modalLoading}>
                    {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </Button>
                </div>
              </>
            )}

            {modalType === 'delete' && (
              <>
                <h2 className="text-xl font-bold mb-4 text-destructive">Delete User</h2>
                <p className="text-sm mb-4">
                  Are you sure you want to delete <strong>{selectedUser.displayName}</strong>?
                  This action cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={closeModal}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDeleteUser} disabled={modalLoading}>
                    {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
