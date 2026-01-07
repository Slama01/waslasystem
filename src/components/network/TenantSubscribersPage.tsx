import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Search, 
  RefreshCw, 
  ArrowRight,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  Wifi,
  Save
} from 'lucide-react';
import { toast } from 'sonner';

interface Subscriber {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  speed: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  package_name: string | null;
  package_price: number | null;
  notes: string | null;
  tenant_id: string;
}

interface TenantSubscribersPageProps {
  tenantId: string;
  tenantName: string;
  onBack: () => void;
}

export const TenantSubscribersPage = ({ tenantId, tenantName, onBack }: TenantSubscribersPageProps) => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingSub, setEditingSub] = useState<Subscriber | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    address: '',
    speed: 0,
    status: '',
    package_name: '',
    package_price: 0,
    notes: ''
  });

  const loadSubscribers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (error) {
      console.error('Error loading subscribers:', error);
      toast.error('حدث خطأ في تحميل المشتركين');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, [tenantId]);

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ||
      sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleEdit = (sub: Subscriber) => {
    setEditingSub(sub);
    setEditFormData({
      name: sub.name,
      phone: sub.phone || '',
      address: sub.address || '',
      speed: sub.speed,
      status: sub.status,
      package_name: sub.package_name || '',
      package_price: sub.package_price || 0,
      notes: sub.notes || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSub) return;

    try {
      const { error } = await supabase
        .from('subscribers')
        .update({
          name: editFormData.name,
          phone: editFormData.phone || null,
          address: editFormData.address || null,
          speed: editFormData.speed,
          status: editFormData.status,
          package_name: editFormData.package_name || null,
          package_price: editFormData.package_price || null,
          notes: editFormData.notes || null
        })
        .eq('id', editingSub.id);

      if (error) throw error;

      toast.success('تم تحديث بيانات المشترك بنجاح');
      setEditingSub(null);
      loadSubscribers();
    } catch (error) {
      console.error('Error updating subscriber:', error);
      toast.error('حدث خطأ أثناء تحديث البيانات');
    }
  };

  const handleDelete = async (subId: string) => {
    try {
      const { error } = await supabase
        .from('subscribers')
        .delete()
        .eq('id', subId);

      if (error) throw error;

      toast.success('تم حذف المشترك بنجاح');
      loadSubscribers();
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      toast.error('حدث خطأ أثناء حذف المشترك');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">نشط</Badge>;
      case 'expired':
        return <Badge variant="destructive">منتهي</Badge>;
      case 'suspended':
        return <Badge variant="secondary">موقوف</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'غير محدد';
    return new Date(dateStr).toLocaleDateString('ar-SA');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">مشتركي {tenantName}</h2>
          <p className="text-sm text-muted-foreground">{subscribers.length} مشترك</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="حالة الاشتراك" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="expired">منتهي</SelectItem>
                <SelectItem value="suspended">موقوف</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadSubscribers} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscribers List */}
      <div className="grid gap-4">
        {filteredSubscribers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد مشتركين</p>
            </CardContent>
          </Card>
        ) : (
          filteredSubscribers.map((sub) => (
            <Card key={sub.id}>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold">{sub.name}</h3>
                      {getStatusBadge(sub.status)}
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      {sub.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{sub.phone}</span>
                        </div>
                      )}
                      {sub.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{sub.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Wifi className="w-3 h-3" />
                        <span>{sub.speed} Mbps</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>ينتهي: {formatDate(sub.end_date)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {/* Edit Dialog */}
                    <Dialog open={editingSub?.id === sub.id} onOpenChange={(open) => !open && setEditingSub(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(sub)}>
                          <Edit className="w-4 h-4 ml-1" />
                          تعديل
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>تعديل بيانات المشترك</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">الاسم</label>
                            <Input
                              value={editFormData.name}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">رقم الهاتف</label>
                            <Input
                              value={editFormData.phone}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">العنوان</label>
                            <Input
                              value={editFormData.address}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">السرعة (Mbps)</label>
                            <Input
                              type="number"
                              value={editFormData.speed}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, speed: Number(e.target.value) }))}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">الحالة</label>
                            <Select 
                              value={editFormData.status} 
                              onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">نشط</SelectItem>
                                <SelectItem value="expired">منتهي</SelectItem>
                                <SelectItem value="suspended">موقوف</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">ملاحظات</label>
                            <Input
                              value={editFormData.notes}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEditingSub(null)}>إلغاء</Button>
                          <Button onClick={handleSaveEdit}>
                            <Save className="w-4 h-4 ml-1" />
                            حفظ
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 ml-1" />
                          حذف
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                          <AlertDialogDescription>
                            سيتم حذف المشترك "{sub.name}" نهائياً. لا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(sub.id)}>
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
