import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Subscriber, Payment, Staff } from '@/types/network';
import { Plus, Search, Trash2, Eye, Calendar, Gauge, Monitor, User, RefreshCw, AlertTriangle, Clock, Ban, DollarSign, CreditCard, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SubscribersPageProps {
  subscribers: Subscriber[];
  staff: Staff[];
  onAdd: (sub: Omit<Subscriber, 'id' | 'status' | 'daysLeft'>, initialPayment?: number) => void;
  onUpdate: (id: string, data: Partial<Subscriber>) => void;
  onDelete: (id: string) => void;
  onExtend: (id: string, days: number, amount: number) => void;
  getSubscriberPayments: (subscriberId: string) => Payment[];
}

export const SubscribersPage = ({ 
  subscribers, 
  staff,
  onAdd, 
  onUpdate,
  onDelete, 
  onExtend,
  getSubscriberPayments 
}: SubscribersPageProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [speedFilter, setSpeedFilter] = useState<string>('all');
  const [selectedSub, setSelectedSub] = useState<Subscriber | null>(null);
  const [editDialogSub, setEditDialogSub] = useState<Subscriber | null>(null);
  const [extendDialogSub, setExtendDialogSub] = useState<Subscriber | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [extendAmount, setExtendAmount] = useState(50);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    devices: 1,
    startDate: '',
    expireDate: '',
    type: 'monthly' as 'monthly' | 'user',
    speed: 20,
    balance: 0,
  });
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    devices: 1,
    startDate: '',
    expireDate: '',
    type: 'monthly' as 'monthly' | 'user',
    speed: 20,
    initialPayment: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.startDate || !formData.expireDate) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }
    const { initialPayment, ...subData } = formData;
    onAdd(subData, initialPayment);
    setFormData({ name: '', phone: '', devices: 1, startDate: '', expireDate: '', type: 'monthly', speed: 20, initialPayment: 0 });
    toast.success('تم إضافة المشترك بنجاح');
  };

  const handleDelete = (id: string) => {
    if (confirm('هل تريد حذف هذا المشترك؟')) {
      onDelete(id);
      toast.success('تم حذف المشترك');
    }
  };

  const handleOpenEditDialog = (sub: Subscriber) => {
    setEditFormData({
      name: sub.name,
      phone: sub.phone,
      devices: sub.devices,
      startDate: sub.startDate,
      expireDate: sub.expireDate,
      type: sub.type,
      speed: sub.speed,
      balance: sub.balance || 0,
    });
    setEditDialogSub(sub);
  };

  const handleEditSubmit = () => {
    if (editDialogSub) {
      onUpdate(editDialogSub.id, editFormData);
      toast.success('تم تعديل بيانات المشترك بنجاح');
      setEditDialogSub(null);
    }
  };

  const handleExtend = () => {
    if (extendDialogSub) {
      onExtend(extendDialogSub.id, extendDays, extendAmount);
      toast.success(`تم تمديد اشتراك ${extendDialogSub.name} بنجاح`);
      setExtendDialogSub(null);
    }
  };

  // Get unique speeds for filter
  const uniqueSpeeds = [...new Set(subscribers.map(s => s.speed))].sort((a, b) => a - b);

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = sub.name.includes(search) || sub.phone.includes(search);
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesSpeed = speedFilter === 'all' || sub.speed.toString() === speedFilter;
    return matchesSearch && matchesStatus && matchesSpeed;
  });

  const statusConfig = {
    active: { color: 'bg-success', textColor: 'text-success', bgColor: 'bg-success/20', label: '🟢 فعّال', icon: null },
    expiring: { color: 'bg-warning', textColor: 'text-warning', bgColor: 'bg-warning/20', label: '🟠 قرب الانتهاء', icon: Clock },
    expired: { color: 'bg-destructive', textColor: 'text-destructive', bgColor: 'bg-destructive/20', label: '🔴 منتهي', icon: AlertTriangle },
    stopped: { color: 'bg-muted-foreground', textColor: 'text-muted-foreground', bgColor: 'bg-muted', label: '⚫ موقوف', icon: Ban },
    indebted: { color: 'bg-purple-500', textColor: 'text-purple-500', bgColor: 'bg-purple-500/20', label: '💸 مديون', icon: DollarSign },
  };

  const getDaysLeftDisplay = (sub: Subscriber) => {
    if (sub.daysLeft === undefined) return null;
    
    if (sub.daysLeft < 0) {
      return (
        <span className="text-destructive font-bold flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          منتهي منذ {Math.abs(sub.daysLeft)} يوم
        </span>
      );
    }
    if (sub.daysLeft === 0) {
      return (
        <span className="text-destructive font-bold animate-pulse">
          ⚠️ ينتهي اليوم!
        </span>
      );
    }
    if (sub.daysLeft === 1) {
      return (
        <span className="text-warning font-bold animate-pulse">
          ⚠️ باقي يوم واحد
        </span>
      );
    }
    if (sub.daysLeft <= 3) {
      return (
        <span className="text-warning font-bold">
          ⚠️ باقي {sub.daysLeft} أيام
        </span>
      );
    }
    return (
      <span className="text-muted-foreground">
        باقي {sub.daysLeft} يوم
      </span>
    );
  };

  return (
    <div className="space-y-4 lg:space-y-6 animate-fade-in">
      {/* Add Form */}
      <Card className="shadow-lg border-border/50">
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
            <Plus className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
            إضافة مشترك جديد
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
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
            <Input
              type="number"
              placeholder="المبلغ المدفوع (شيكل)"
              value={formData.initialPayment || ''}
              onChange={(e) => setFormData({ ...formData, initialPayment: parseInt(e.target.value) || 0 })}
            />
            <Button type="submit" className="gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 ml-2" />
              إضافة مشترك
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 lg:gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو رقم الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1 sm:w-40 lg:w-48">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="active">🟢 فعّال</SelectItem>
              <SelectItem value="expiring">🟠 قرب الانتهاء</SelectItem>
              <SelectItem value="expired">🔴 منتهي</SelectItem>
              <SelectItem value="stopped">⚫ موقوف</SelectItem>
              <SelectItem value="indebted">💸 مديون</SelectItem>
            </SelectContent>
          </Select>
          <Select value={speedFilter} onValueChange={setSpeedFilter}>
            <SelectTrigger className="flex-1 sm:w-40 lg:w-48">
              <SelectValue placeholder="السرعة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل السرعات</SelectItem>
              {uniqueSpeeds.map(speed => (
                <SelectItem key={speed} value={speed.toString()}>{speed} Mbps</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        عدد النتائج: {filteredSubscribers.length} من {subscribers.length}
      </div>

      {/* Subscribers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
        {filteredSubscribers.map((sub, index) => {
          const config = statusConfig[sub.status];
          return (
            <Card 
              key={sub.id} 
              className={cn(
                "shadow-lg border-border/50 hover:shadow-xl transition-all duration-300 animate-slide-up",
                sub.status === 'expiring' && "border-warning/50",
                sub.status === 'expired' && "border-destructive/50",
                sub.status === 'indebted' && "border-purple-500/50"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-3 sm:p-4 lg:p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      config.bgColor
                    )}>
                      <User className={cn("w-6 h-6", config.textColor)} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{sub.name}</h3>
                      <p className="text-sm text-muted-foreground">{sub.phone}</p>
                    </div>
                  </div>
                  <div className={cn("w-3 h-3 rounded-full animate-pulse", config.color)} />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Gauge className="w-4 h-4" />
                    <span>{sub.speed} Mbps</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {getDaysLeftDisplay(sub)}
                  </div>
                  {sub.type === 'user' && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Monitor className="w-4 h-4" />
                      <span>{sub.devices} جهاز</span>
                    </div>
                  )}
                  {sub.balance && sub.balance > 0 && (
                    <div className="flex items-center gap-2 text-purple-500 font-medium">
                      <DollarSign className="w-4 h-4" />
                      <span>مديون: {sub.balance} شيكل</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    config.bgColor, config.textColor
                  )}>
                    {config.label}
                  </span>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-primary hover:bg-primary/10"
                      onClick={() => setExtendDialogSub(sub)}
                      title="تمديد الاشتراك"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-amber-500 hover:bg-amber-500/10"
                      onClick={() => handleOpenEditDialog(sub)}
                      title="تعديل البيانات"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
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
          );
        })}
      </div>

      {filteredSubscribers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          لا يوجد مشتركين
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={!!selectedSub} onOpenChange={() => setSelectedSub(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تفاصيل المشترك</DialogTitle>
          </DialogHeader>
          {selectedSub && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center",
                  statusConfig[selectedSub.status].bgColor
                )}>
                  <User className={cn("w-8 h-8", statusConfig[selectedSub.status].textColor)} />
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
                    statusConfig[selectedSub.status].bgColor,
                    statusConfig[selectedSub.status].textColor
                  )}>
                    {statusConfig[selectedSub.status].label}
                  </span>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  سجل الدفعات
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {getSubscriberPayments(selectedSub.id).length > 0 ? (
                    getSubscriberPayments(selectedSub.id).map(payment => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium">{payment.amount} شيكل</p>
                          <p className="text-xs text-muted-foreground">{payment.notes}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-sm">{payment.date}</p>
                          <p className="text-xs text-muted-foreground">{payment.staffName}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">لا يوجد دفعات مسجلة</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Extend Dialog */}
      <Dialog open={!!extendDialogSub} onOpenChange={() => setExtendDialogSub(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              تمديد اشتراك
            </DialogTitle>
          </DialogHeader>
          {extendDialogSub && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                تمديد اشتراك <span className="font-bold text-foreground">{extendDialogSub.name}</span>
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">عدد الأيام</label>
                  <Select value={extendDays.toString()} onValueChange={(v) => setExtendDays(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 أيام</SelectItem>
                      <SelectItem value="15">15 يوم</SelectItem>
                      <SelectItem value="30">30 يوم (شهر)</SelectItem>
                      <SelectItem value="60">60 يوم</SelectItem>
                      <SelectItem value="90">90 يوم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">المبلغ (شيكل)</label>
                  <Input
                    type="number"
                    value={extendAmount}
                    onChange={(e) => setExtendAmount(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm">
                  تاريخ الانتهاء الجديد: <span className="font-bold">
                    {(() => {
                      const newDate = new Date(extendDialogSub.expireDate);
                      newDate.setDate(newDate.getDate() + extendDays);
                      return newDate.toISOString().split('T')[0];
                    })()}
                  </span>
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialogSub(null)}>إلغاء</Button>
            <Button onClick={handleExtend} className="gradient-primary">
              <RefreshCw className="w-4 h-4 ml-2" />
              تمديد الاشتراك
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDialogSub} onOpenChange={() => setEditDialogSub(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-amber-500" />
              تعديل بيانات المشترك
            </DialogTitle>
          </DialogHeader>
          {editDialogSub && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">الاسم</label>
                  <Input
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">رقم الهاتف</label>
                  <Input
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">تاريخ البداية</label>
                  <Input
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">تاريخ الانتهاء</label>
                  <Input
                    type="date"
                    value={editFormData.expireDate}
                    onChange={(e) => setEditFormData({ ...editFormData, expireDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">نوع الاشتراك</label>
                  <Select
                    value={editFormData.type}
                    onValueChange={(v) => setEditFormData({ ...editFormData, type: v as 'monthly' | 'user' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">شهري</SelectItem>
                      <SelectItem value="user">يوزر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">السرعة (Mbps)</label>
                  <Input
                    type="number"
                    value={editFormData.speed}
                    onChange={(e) => setEditFormData({ ...editFormData, speed: parseInt(e.target.value) || 0 })}
                  />
                </div>
                {editFormData.type === 'user' && (
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">عدد الأجهزة</label>
                    <Input
                      type="number"
                      value={editFormData.devices}
                      onChange={(e) => setEditFormData({ ...editFormData, devices: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">المديونية (شيكل)</label>
                  <Input
                    type="number"
                    value={editFormData.balance || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, balance: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogSub(null)}>إلغاء</Button>
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
