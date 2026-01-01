'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { formatPlatformName } from '@/lib/utils';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  tags: string[];
  screenshots: string[];
  isFeatured: boolean;
  isPublished: boolean;
  downloads: number;
  likesCount: number;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    email: string;
  };
  project: {
    platform: string;
  };
}

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'edit' | 'delete' | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');

  useEffect(() => {
    loadProducts();
  }, [page]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAdminProducts(page, 20, search || undefined);
      setProducts(data.items);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setEditName(product.name);
    setEditDescription(product.description);
    setEditTags(product.tags.join(', '));
    setModalType('edit');
    setActionMenu(null);
  };

  const openDeleteModal = (product: Product) => {
    setSelectedProduct(product);
    setModalType('delete');
    setActionMenu(null);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setModalType(null);
    setEditName('');
    setEditDescription('');
    setEditTags('');
  };

  const handleUpdate = async () => {
    if (!selectedProduct) return;
    setModalLoading(true);
    try {
      await api.updateAdminProduct(selectedProduct.id, {
        name: editName,
        description: editDescription,
        tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      toast({ title: 'Success', description: 'Product updated' });
      closeModal();
      loadProducts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    setModalLoading(true);
    try {
      await api.deleteAdminProduct(selectedProduct.id);
      toast({ title: 'Success', description: 'Product deleted' });
      closeModal();
      loadProducts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setModalLoading(false);
    }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      await api.updateAdminProduct(product.id, { isFeatured: !product.isFeatured });
      toast({
        title: 'Success',
        description: product.isFeatured ? 'Removed from featured' : 'Added to featured',
      });
      loadProducts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setActionMenu(null);
  };

  const togglePublished = async (product: Product) => {
    try {
      await api.updateAdminProduct(product.id, { isPublished: !product.isPublished });
      toast({
        title: 'Success',
        description: product.isPublished ? 'Product unpublished' : 'Product published',
      });
      loadProducts();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setActionMenu(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Product Management</h1>
        <p className="text-muted-foreground mt-1">Manage community posts and products</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Products Table */}
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
                    <th className="text-left p-4 font-medium">Product</th>
                    <th className="text-left p-4 font-medium">Author</th>
                    <th className="text-left p-4 font-medium">Platform</th>
                    <th className="text-left p-4 font-medium">Stats</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-muted/30">
                      <td className="p-4">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {product.name}
                            {product.isFeatured && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                            {product.description}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {product.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-muted px-2 py-0.5 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{product.user.displayName}</div>
                        <div className="text-xs text-muted-foreground">{product.user.email}</div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{formatPlatformName(product.project.platform)}</span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div>👍 {product.likesCount}</div>
                          <div>⬇️ {product.downloads}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            product.isPublished
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {product.isPublished ? 'Published' : 'Hidden'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setActionMenu(actionMenu === product.id ? null : product.id)}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          {actionMenu === product.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-card border rounded-md shadow-lg z-10">
                              <button
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center"
                                onClick={() => openEditModal(product)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </button>
                              <button
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center"
                                onClick={() => toggleFeatured(product)}
                              >
                                {product.isFeatured ? (
                                  <>
                                    <StarOff className="h-4 w-4 mr-2" />
                                    Remove Featured
                                  </>
                                ) : (
                                  <>
                                    <Star className="h-4 w-4 mr-2" />
                                    Make Featured
                                  </>
                                )}
                              </button>
                              <button
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center"
                                onClick={() => togglePublished(product)}
                              >
                                {product.isPublished ? (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Unpublish
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Publish
                                  </>
                                )}
                              </button>
                              <button
                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center text-destructive"
                                onClick={() => openDeleteModal(product)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </button>
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
      {modalType && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-card border rounded-lg p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            {modalType === 'edit' && (
              <>
                <h2 className="text-xl font-bold mb-4">Edit Product</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Name</label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full p-2 border rounded bg-background min-h-[100px]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Tags (comma separated)</label>
                    <Input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="minecraft, plugin, utility"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <Button variant="outline" onClick={closeModal}>Cancel</Button>
                  <Button onClick={handleUpdate} disabled={modalLoading}>
                    {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                  </Button>
                </div>
              </>
            )}

            {modalType === 'delete' && (
              <>
                <h2 className="text-xl font-bold mb-4 text-destructive">Delete Product</h2>
                <p className="text-sm mb-4">
                  Are you sure you want to delete <strong>{selectedProduct.name}</strong>?
                  This action cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={closeModal}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={modalLoading}>
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
