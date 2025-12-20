import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Router as RouterType } from '@/types/network';
import { Plus, Trash2, Eye, MapPin, Wifi, WifiOff, Server, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RoutersPageProps {
  routers: RouterType[];
  onAdd: (router: Omit<RouterType, 'id'>) => void;
  onUpdate: (id: string, data: Partial<RouterType>) => void;
  onDelete: (id: string) => void;
}

export const RoutersPage = ({ routers, onAdd, onUpdate, onDelete }: RoutersPageProps) => {
  const [selectedRouter, setSelectedRouter] = useState<RouterType | null>(null);
  const [editDialogRouter, setEditDialogRouter] = useState<RouterType | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    model: '',
    location: '',
    status: 'online' as 'online' | 'offline',
    ip: '',
  });
  const [customModel, setCustomModel] = useState('');
  const [showCustomModel, setShowCustomModel] = useState(false);
  const [routerModels, setRouterModels] = useState<string[]>(() => {
    const saved = localStorage.getItem('routerModels');
    return saved ? JSON.parse(saved) : ['Mikrotik', 'TP-Link', 'D-Link', 'Ubiquiti'];
  });
  const [formData, setFormData] = useState({
    name: '',
    model: 'Mikrotik',
    location: '',
    status: 'online' as 'online' | 'offline',
    ip: '',
    subscribersCount: 0,
  });

  const handleAddCustomModel = () => {
    if (customModel.trim() && !routerModels.includes(customModel.trim())) {
      const updated = [...routerModels, customModel.trim()];
      setRouterModels(updated);
      localStorage.setItem('routerModels', JSON.stringify(updated));
      setFormData({ ...formData, model: customModel.trim() });
      setCustomModel('');
      setShowCustomModel(false);
      toast.success('تم إضافة النوع بنجاح');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }
    onAdd(formData);
    setFormData({ name: '', model: 'Mikrotik', location: '', status: 'online', ip: '', subscribersCount: 0 });
    toast.success('تم إضافة الراوتر بنجاح');
  };

  const handleDelete = (id: string) => {
    if (confirm('هل تريد حذف هذا الراوتر؟')) {
      onDelete(id);
      toast.success('تم حذف الراوتر');
    }
  };

  const handleOpenEditDialog = (router: RouterType) => {
    setEditFormData({
      name: router.name,
      model: router.model,
      location: router.location,
      status: router.status,
      ip: router.ip || '',
    });
    setEditDialogRouter(router);
  };

  const handleEditSubmit = () => {
    if (editDialogRouter) {
      onUpdate(editDialogRouter.id, editFormData);
      toast.success('تم تعديل بيانات الراوتر بنجاح');
      setEditDialogRouter(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Add Form */}
      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            إضافة راوتر جديد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              placeholder="اسم الراوتر"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <div className="space-y-2">
              {!showCustomModel ? (
                <Select
                  value={formData.model}
                  onValueChange={(v) => {
                    if (v === 'add_new') {
                      setShowCustomModel(true);
                    } else {
                      setFormData({ ...formData, model: v });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="الموديل" />
                  </SelectTrigger>
                  <SelectContent>
                    {routerModels.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                    <SelectItem value="add_new" className="text-primary font-medium">
                      + إضافة نوع جديد
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="اسم النوع الجديد"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" size="sm" onClick={handleAddCustomModel} className="gradient-primary">
                    إضافة
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setShowCustomModel(false)}>
                    إلغاء
                  </Button>
                </div>
              )}
            </div>
            <Input
              placeholder="الموقع"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <Input
              placeholder="عنوان IP"
              value={formData.ip}
              onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
            />
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v as 'online' | 'offline' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">متصل</SelectItem>
                <SelectItem value="offline">غير متصل</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 ml-2" />
              إضافة راوتر
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Routers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routers.map((router, index) => (
          <Card 
            key={router.id} 
            className={cn(
              "shadow-lg border-border/50 hover:shadow-xl transition-all duration-300 animate-slide-up overflow-hidden",
              router.status === 'online' ? "border-t-4 border-t-success" : "border-t-4 border-t-destructive"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center",
                    router.status === 'online' ? "bg-success/20" : "bg-destructive/20"
                  )}>
                    {router.status === 'online' ? (
                      <Wifi className="w-7 h-7 text-success" />
                    ) : (
                      <WifiOff className="w-7 h-7 text-destructive" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{router.name}</h3>
                    <p className="text-sm text-muted-foreground">{router.model}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{router.location}</span>
                </div>
                {router.ip && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Server className="w-4 h-4" />
                    <span>{router.ip}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  router.status === 'online' ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                )}>
                  {router.status === 'online' ? 'متصل' : 'غير متصل'}
                </span>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-amber-500 hover:bg-amber-500/10"
                    onClick={() => handleOpenEditDialog(router)}
                    title="تعديل البيانات"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedRouter(router)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(router.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {routers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          لا يوجد راوترات
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={!!selectedRouter} onOpenChange={() => setSelectedRouter(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تفاصيل الراوتر</DialogTitle>
          </DialogHeader>
          {selectedRouter && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center",
                  selectedRouter.status === 'online' ? "bg-success/20" : "bg-destructive/20"
                )}>
                  {selectedRouter.status === 'online' ? (
                    <Wifi className="w-8 h-8 text-success" />
                  ) : (
                    <WifiOff className="w-8 h-8 text-destructive" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedRouter.name}</h3>
                  <p className="text-muted-foreground">{selectedRouter.model}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl">
                <div>
                  <p className="text-sm text-muted-foreground">الموقع</p>
                  <p className="font-medium">{selectedRouter.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">عنوان IP</p>
                  <p className="font-medium">{selectedRouter.ip || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  <span className={cn(
                    "inline-block px-3 py-1 rounded-full text-xs font-medium mt-1",
                    selectedRouter.status === 'online' ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                  )}>
                    {selectedRouter.status === 'online' ? 'متصل' : 'غير متصل'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDialogRouter} onOpenChange={() => setEditDialogRouter(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-amber-500" />
              تعديل بيانات الراوتر
            </DialogTitle>
          </DialogHeader>
          {editDialogRouter && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">اسم الراوتر</label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">الموديل</label>
                <Select
                  value={editFormData.model}
                  onValueChange={(v) => setEditFormData({ ...editFormData, model: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {routerModels.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">الموقع</label>
                <Input
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">عنوان IP</label>
                <Input
                  value={editFormData.ip}
                  onChange={(e) => setEditFormData({ ...editFormData, ip: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">الحالة</label>
                <Select
                  value={editFormData.status}
                  onValueChange={(v) => setEditFormData({ ...editFormData, status: v as 'online' | 'offline' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">متصل</SelectItem>
                    <SelectItem value="offline">غير متصل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogRouter(null)}>إلغاء</Button>
            <Button onClick={handleEditSubmit} className="bg-amber-500 hover:bg-amber-600">
              <Edit className="w-4 h-4 ml-2" />
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
