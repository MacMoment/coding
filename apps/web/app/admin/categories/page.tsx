'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Loader2,
  Tags,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  order: number;
  createdAt: string;
}

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAdminCategories();
      setCategories(data);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to load categories',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedCategory(null);
    setCategoryName('');
    setModalType('create');
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setCategoryName(category.name);
    setModalType('edit');
  };

  const openDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    setModalType('delete');
  };

  const closeModal = () => {
    setSelectedCategory(null);
    setModalType(null);
    setCategoryName('');
  };

  const handleCreate = async () => {
    if (!categoryName.trim()) return;
    setModalLoading(true);
    try {
      await api.createAdminCategory({ name: categoryName.trim() });
      toast({ title: 'Success', description: 'Category created' });
      closeModal();
      loadCategories();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCategory || !categoryName.trim()) return;
    setModalLoading(true);
    try {
      await api.updateAdminCategory(selectedCategory.id, { name: categoryName.trim() });
      toast({ title: 'Success', description: 'Category updated' });
      closeModal();
      loadCategories();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    setModalLoading(true);
    try {
      await api.deleteAdminCategory(selectedCategory.id);
      toast({ title: 'Success', description: 'Category deleted' });
      closeModal();
      loadCategories();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const oldIndex = categories.findIndex((c) => c.id === draggedId);
    const newIndex = categories.findIndex((c) => c.id === targetId);

    if (oldIndex === -1 || newIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Reorder locally first for instant feedback
    const newCategories = [...categories];
    const [removed] = newCategories.splice(oldIndex, 1);
    newCategories.splice(newIndex, 0, removed);
    setCategories(newCategories);
    setDraggedId(null);

    // Send new order to server
    try {
      await api.reorderAdminCategories(newCategories.map((c) => c.id));
      toast({ title: 'Success', description: 'Categories reordered' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      loadCategories(); // Reload on error
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-muted-foreground mt-1">Manage product tags and categories</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Categories
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Drag and drop to reorder categories
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <Tags className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No categories yet</p>
              <Button className="mt-4" onClick={openCreateModal}>
                Create First Category
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, category.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, category.id)}
                  className={`flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-move ${
                    draggedId === category.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">{category.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        (Order: {category.order})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteModal(category)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-card border rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {modalType === 'create' && (
              <>
                <h2 className="text-xl font-bold mb-4">Create Category</h2>
                <Input
                  placeholder="Category name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  className="mb-4"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={closeModal}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={modalLoading || !categoryName.trim()}>
                    {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                  </Button>
                </div>
              </>
            )}

            {modalType === 'edit' && selectedCategory && (
              <>
                <h2 className="text-xl font-bold mb-4">Edit Category</h2>
                <Input
                  placeholder="Category name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                  className="mb-4"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={closeModal}>Cancel</Button>
                  <Button onClick={handleUpdate} disabled={modalLoading || !categoryName.trim()}>
                    {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </Button>
                </div>
              </>
            )}

            {modalType === 'delete' && selectedCategory && (
              <>
                <h2 className="text-xl font-bold mb-4 text-destructive">Delete Category</h2>
                <p className="text-sm mb-4">
                  Are you sure you want to delete <strong>{selectedCategory.name}</strong>?
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
