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
  Image,
  Grid2X2,
} from 'lucide-react';

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  gridSize: number;
  order: number;
  createdAt: string;
}

export default function AdminPortfolioPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [gridSize, setGridSize] = useState(1);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAdminPortfolio();
      setItems(data);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to load portfolio',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImageUrl('');
    setGridSize(1);
  };

  const openCreateModal = () => {
    setSelectedItem(null);
    resetForm();
    setModalType('create');
  };

  const openEditModal = (item: PortfolioItem) => {
    setSelectedItem(item);
    setTitle(item.title);
    setDescription(item.description || '');
    setImageUrl(item.imageUrl);
    setGridSize(item.gridSize);
    setModalType('edit');
  };

  const openDeleteModal = (item: PortfolioItem) => {
    setSelectedItem(item);
    setModalType('delete');
  };

  const closeModal = () => {
    setSelectedItem(null);
    setModalType(null);
    resetForm();
  };

  const handleCreate = async () => {
    if (!title.trim() || !imageUrl.trim()) return;
    setModalLoading(true);
    try {
      await api.createAdminPortfolioItem({
        title: title.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim(),
        gridSize,
      });
      toast({ title: 'Success', description: 'Portfolio item created' });
      closeModal();
      loadPortfolio();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem || !title.trim() || !imageUrl.trim()) return;
    setModalLoading(true);
    try {
      await api.updateAdminPortfolioItem(selectedItem.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim(),
        gridSize,
      });
      toast({ title: 'Success', description: 'Portfolio item updated' });
      closeModal();
      loadPortfolio();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setModalLoading(true);
    try {
      await api.deleteAdminPortfolioItem(selectedItem.id);
      toast({ title: 'Success', description: 'Portfolio item deleted' });
      closeModal();
      loadPortfolio();
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

    const oldIndex = items.findIndex((i) => i.id === draggedId);
    const newIndex = items.findIndex((i) => i.id === targetId);

    if (oldIndex === -1 || newIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Reorder locally first for instant feedback
    const newItems = [...items];
    const [removed] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, removed);
    setItems(newItems);
    setDraggedId(null);

    // Send new order to server
    try {
      await api.reorderAdminPortfolio(newItems.map((i) => i.id));
      toast({ title: 'Success', description: 'Portfolio reordered' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      loadPortfolio(); // Reload on error
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Management</h1>
          <p className="text-muted-foreground mt-1">Manage portfolio images and grid layout</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Portfolio Items
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Drag and drop to reorder items. New items are added to the end by default.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No portfolio items yet</p>
              <Button className="mt-4" onClick={openCreateModal}>
                Add First Item
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, item.id)}
                  className={`border rounded-lg overflow-hidden bg-card hover:border-primary transition-colors cursor-move ${
                    draggedId === item.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="relative aspect-video bg-muted">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Error';
                        }}
                      />
                    )}
                    <div className="absolute top-2 left-2">
                      <GripVertical className="h-5 w-5 text-white drop-shadow-lg" />
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 rounded px-2 py-1 text-white text-xs">
                      <Grid2X2 className="h-3 w-3" />
                      {item.gridSize}x
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium truncate">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-muted-foreground">
                        Order: {item.order}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(item)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
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
          <div className="bg-card border rounded-lg p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            {(modalType === 'create' || modalType === 'edit') && (
              <>
                <h2 className="text-xl font-bold mb-4">
                  {modalType === 'create' ? 'Add Portfolio Item' : 'Edit Portfolio Item'}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Title *</label>
                    <Input
                      placeholder="Item title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Description</label>
                    <textarea
                      placeholder="Optional description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-2 border rounded bg-background min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Image URL *</label>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    {imageUrl && (
                      <div className="mt-2 border rounded overflow-hidden aspect-video max-h-40">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Invalid+URL';
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Grid Size</label>
                    <p className="text-xs text-muted-foreground mb-2">
                      How many grid columns this item should span (1-4)
                    </p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((size) => (
                        <Button
                          key={size}
                          type="button"
                          variant={gridSize === size ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setGridSize(size)}
                        >
                          {size}x
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <Button variant="outline" onClick={closeModal}>Cancel</Button>
                  <Button
                    onClick={modalType === 'create' ? handleCreate : handleUpdate}
                    disabled={modalLoading || !title.trim() || !imageUrl.trim()}
                  >
                    {modalLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : modalType === 'create' ? (
                      'Create'
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
              </>
            )}

            {modalType === 'delete' && selectedItem && (
              <>
                <h2 className="text-xl font-bold mb-4 text-destructive">Delete Portfolio Item</h2>
                <p className="text-sm mb-4">
                  Are you sure you want to delete <strong>{selectedItem.title}</strong>?
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
