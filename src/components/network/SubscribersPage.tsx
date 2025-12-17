import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Subscriber } from '@/types/network';
import { Plus, Search, Trash2, Eye, Phone, Calendar, Gauge, Monitor, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SubscribersPageProps {
  subscribers: Subscriber[];
  onAdd: (sub: Omit<Subscriber, 'id' | 'status'>) => void;
  onDelete: (id: string) => void;
}

export const SubscribersPage = ({ subscribers, onAdd, onDelete }: SubscribersPageProps) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [selectedSub, setSelectedSub] = useState<Subscriber | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    devices: 1,
    startDate: '',
    expireDate: '',
    type: 'monthly' as 'monthly' | 'user',
    speed: 20,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.startDate || !formData.expireDate) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }
    onAdd(formData);
    setFormData({ name: '', phone: '', devices: 1, startDate: '', expireDate: '', type: 'monthly', speed: 20 });
    toast.success('تم إضافة المشترك بنجاح');
  };

  const handleDelete = (id: string) => {
    if (confirm('هل تريد حذف هذا المشترك؟')) {
      onDelete(id);
      toast.success('تم حذف المشترك');
    }
  };

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = sub.name.includes(search) || sub.phone.includes(search);
    const matchesFilter = filter === 'all' || sub.status === filter;
    return matchesSearch && matchesFilter;
  });

  const statusColors = {
    active: 'bg-success',
    expiring: 'bg-warning',
    expired: 'bg-destructive',
  };

  const statusLabels = {
    active: 'نشط',
    expiring: 'قارب على الانتهاء',
    expired: 'منتهي',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Add Form */}
      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            إضافة مشترك جديد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="اسم المشترك"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              placeholder="رقم الهاتف"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              type="date"
              placeholder="تاريخ البداية"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              type="date"
              placeholder="تاريخ الانتهاء"
              value={formData.expireDate}
              onChange={(e) => setFormData({ ...formData, expireDate: e.target.value })}
            />
            <Select
              value={formData.type}
              onValueChange={(v) => setFormData({ ...formData, type: v as 'monthly' | 'user' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="نوع الاشتراك" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">شهري</SelectItem>
                <SelectItem value="user">يوزر</SelectItem>
              </SelectContent>
            </Select>
            {formData.type === 'user' && (
              <Input
                type="number"
                placeholder="عدد الأجهزة"
                value={formData.devices}
                onChange={(e) => setFormData({ ...formData, devices: parseInt(e.target.value) || 1 })}
              />
            )}
            <Input
              type="number"
              placeholder="السرعة (Mbps)"
              value={formData.speed}
              onChange={(e) => setFormData({ ...formData, speed: parseInt(e.target.value) || 20 })}
            />
            <Button type="submit" className="gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 ml-2" />
              إضافة مشترك
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو رقم الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="تصفية حسب الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="expiring">قارب على الانتهاء</SelectItem>
            <SelectItem value="expired">منتهي</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscribers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubscribers.map((sub, index) => (
          <Card 
            key={sub.id} 
            className="shadow-lg border-border/50 hover:shadow-xl transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{sub.name}</h3>
                    <p className="text-sm text-muted-foreground">{sub.phone}</p>
                  </div>
                </div>
                <div className={cn("w-3 h-3 rounded-full", statusColors[sub.status])} />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Gauge className="w-4 h-4" />
                  <span>{sub.speed} Mbps</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>ينتهي: {sub.expireDate}</span>
                </div>
                {sub.type === 'user' && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Monitor className="w-4 h-4" />
                    <span>{sub.devices} جهاز</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  sub.status === 'active' && "bg-success/20 text-success",
                  sub.status === 'expiring' && "bg-warning/20 text-warning",
                  sub.status === 'expired' && "bg-destructive/20 text-destructive",
                )}>
                  {statusLabels[sub.status]}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedSub(sub)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(sub.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSubscribers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          لا يوجد مشتركين
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={!!selectedSub} onOpenChange={() => setSelectedSub(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تفاصيل المشترك</DialogTitle>
          </DialogHeader>
          {selectedSub && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedSub.name}</h3>
                  <p className="text-muted-foreground">{selectedSub.phone}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl">
                <div>
                  <p className="text-sm text-muted-foreground">نوع الاشتراك</p>
                  <p className="font-medium">{selectedSub.type === 'monthly' ? 'شهري' : 'يوزر'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">السرعة</p>
                  <p className="font-medium">{selectedSub.speed} Mbps</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ البداية</p>
                  <p className="font-medium">{selectedSub.startDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
                  <p className="font-medium">{selectedSub.expireDate}</p>
                </div>
                {selectedSub.type === 'user' && (
                  <div>
                    <p className="text-sm text-muted-foreground">عدد الأجهزة</p>
                    <p className="font-medium">{selectedSub.devices}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  <span className={cn(
                    "inline-block px-3 py-1 rounded-full text-xs font-medium mt-1",
                    selectedSub.status === 'active' && "bg-success/20 text-success",
                    selectedSub.status === 'expiring' && "bg-warning/20 text-warning",
                    selectedSub.status === 'expired' && "bg-destructive/20 text-destructive",
                  )}>
                    {statusLabels[selectedSub.status]}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
