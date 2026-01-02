import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePackages, Package } from '@/hooks/usePackages';
import { Plus, Trash2, Edit, Package as PackageIcon, Gauge, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export const PackagesPage = () => {
  const { packages, addPackage, updatePackage, deletePackage } = usePackages();
  const [editPackage, setEditPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    speed: 10,
    price: 50,
    duration_days: 30,
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('الرجاء إدخال اسم الباقة');
      return;
    }

    try {
      await addPackage(formData);
      setFormData({ name: '', speed: 10, price: 50, duration_days: 30, description: '' });
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleEdit = async () => {
    if (!editPackage) return;

    try {
      await updatePackage(editPackage.id, {
        name: formData.name,
        speed: formData.speed,
        price: formData.price,
        duration_days: formData.duration_days,
        description: formData.description || null,
      });
      setEditPackage(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل تريد حذف هذه الباقة؟')) {
      try {
        await deletePackage(id);
      } catch (error) {
        // Error handled in hook
      }
    }
  };

  const openEditDialog = (pkg: Package) => {
    setFormData({
      name: pkg.name,
      speed: pkg.speed,
      price: pkg.price,
      duration_days: pkg.duration_days,
      description: pkg.description || '',
    });
    setEditPackage(pkg);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Add Form */}
      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            إضافة باقة جديدة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              placeholder="اسم الباقة (مثال: باقة 20 ميجا)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              type="number"
              placeholder="السرعة (Mbps)"
              value={formData.speed}
              onChange={(e) => setFormData({ ...formData, speed: parseInt(e.target.value) || 0 })}
            />
            <Input
              type="number"
              placeholder="السعر (شيكل)"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
            />
            <Input
              type="number"
              placeholder="المدة (أيام)"
              value={formData.duration_days}
              onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 30 })}
            />
            <Button type="submit" className="gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 ml-2" />
              إضافة
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {packages.map((pkg, index) => (
          <Card 
            key={pkg.id} 
            className="shadow-lg border-border/50 hover:shadow-xl transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <PackageIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{pkg.name}</h3>
                    {pkg.description && (
                      <p className="text-sm text-muted-foreground">{pkg.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Gauge className="w-4 h-4" />
                  <span>{pkg.speed} Mbps</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <DollarSign className="w-4 h-4" />
                  <span>{pkg.price} شيكل</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{pkg.duration_days} يوم</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 mt-4 pt-4 border-t border-border">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-amber-500 hover:bg-amber-500/10"
                  onClick={() => openEditDialog(pkg)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(pkg.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {packages.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <PackageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>لا توجد باقات. أضف باقة جديدة للبدء.</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editPackage} onOpenChange={() => setEditPackage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الباقة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="اسم الباقة"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              type="number"
              placeholder="السرعة (Mbps)"
              value={formData.speed}
              onChange={(e) => setFormData({ ...formData, speed: parseInt(e.target.value) || 0 })}
            />
            <Input
              type="number"
              placeholder="السعر (شيكل)"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
            />
            <Input
              type="number"
              placeholder="المدة (أيام)"
              value={formData.duration_days}
              onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 30 })}
            />
            <Input
              placeholder="وصف الباقة (اختياري)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPackage(null)}>إلغاء</Button>
            <Button onClick={handleEdit} className="gradient-primary">حفظ التعديلات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
