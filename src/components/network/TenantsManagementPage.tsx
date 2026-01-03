import { useState } from 'react';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Users, 
  Calendar, 
  Mail, 
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Settings2,
  CalendarPlus
} from 'lucide-react';

export const TenantsManagementPage = () => {
  const { 
    tenants, 
    isLoading, 
    toggleTenantStatus, 
    extendTrial, 
    activateSubscription,
    refreshTenants 
  } = useSuperAdmin();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState('14');
  const [subscriptionMonths, setSubscriptionMonths] = useState('1');

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.owner_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.owner_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && tenant.is_active && tenant.subscription_status === 'active') ||
      (statusFilter === 'trial' && tenant.subscription_status === 'trial') ||
      (statusFilter === 'inactive' && !tenant.is_active) ||
      (statusFilter === 'expired' && tenant.subscription_status === 'expired');

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (tenant: typeof tenants[0]) => {
    if (!tenant.is_active) {
      return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> معطل</Badge>;
    }
    if (tenant.subscription_status === 'active') {
      return <Badge className="bg-green-500 gap-1"><CheckCircle2 className="w-3 h-3" /> نشط</Badge>;
    }
    if (tenant.subscription_status === 'trial') {
      const daysLeft = tenant.subscription_ends_at 
        ? Math.ceil((new Date(tenant.subscription_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;
      return (
        <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 gap-1">
          <Clock className="w-3 h-3" /> تجريبي ({daysLeft > 0 ? `${daysLeft} يوم` : 'منتهي'})
        </Badge>
      );
    }
    return <Badge variant="outline" className="gap-1"><XCircle className="w-3 h-3" /> منتهي</Badge>;
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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tenants.length}</p>
                <p className="text-sm text-muted-foreground">إجمالي الشركات</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tenants.filter(t => t.is_active && t.subscription_status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">اشتراكات نشطة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tenants.filter(t => t.subscription_status === 'trial').length}
                </p>
                <p className="text-sm text-muted-foreground">فترة تجريبية</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tenants.filter(t => !t.is_active).length}
                </p>
                <p className="text-sm text-muted-foreground">حسابات معطلة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو البريد الإلكتروني..."
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
                <SelectItem value="trial">تجريبي</SelectItem>
                <SelectItem value="inactive">معطل</SelectItem>
                <SelectItem value="expired">منتهي</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={refreshTenants} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tenants List */}
      <div className="grid gap-4">
        {filteredTenants.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              لا توجد نتائج مطابقة للبحث
            </CardContent>
          </Card>
        ) : (
          filteredTenants.map((tenant) => (
            <Card key={tenant.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  {/* Main Info */}
                  <div className="flex-1 p-4 lg:p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{tenant.name}</h3>
                          <p className="text-sm text-muted-foreground">{tenant.slug}</p>
                        </div>
                      </div>
                      {getStatusBadge(tenant)}
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{tenant.owner_email || 'غير محدد'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{tenant.subscribers_count} مشترك</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>ينتهي: {formatDate(tenant.subscription_ends_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>انضم: {formatDate(tenant.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row lg:flex-col gap-2 p-4 lg:p-6 bg-muted/30 lg:border-r border-t lg:border-t-0">
                    <Button
                      variant={tenant.is_active ? "destructive" : "default"}
                      size="sm"
                      className="flex-1 lg:flex-none gap-2"
                      onClick={() => toggleTenantStatus(tenant.id, !tenant.is_active)}
                    >
                      {tenant.is_active ? (
                        <>
                          <XCircle className="w-4 h-4" />
                          تعطيل
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          تفعيل
                        </>
                      )}
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 lg:flex-none gap-2">
                          <CalendarPlus className="w-4 h-4" />
                          تمديد
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>تمديد الفترة التجريبية - {tenant.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">عدد الأيام</label>
                            <Select value={extendDays} onValueChange={setExtendDays}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="7">7 أيام</SelectItem>
                                <SelectItem value="14">14 يوم</SelectItem>
                                <SelectItem value="30">30 يوم</SelectItem>
                                <SelectItem value="60">60 يوم</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={() => extendTrial(tenant.id, parseInt(extendDays))}
                          >
                            تمديد الفترة التجريبية
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="secondary" size="sm" className="flex-1 lg:flex-none gap-2">
                          <Settings2 className="w-4 h-4" />
                          اشتراك
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>تفعيل اشتراك - {tenant.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">مدة الاشتراك</label>
                            <Select value={subscriptionMonths} onValueChange={setSubscriptionMonths}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">شهر واحد</SelectItem>
                                <SelectItem value="3">3 أشهر</SelectItem>
                                <SelectItem value="6">6 أشهر</SelectItem>
                                <SelectItem value="12">سنة كاملة</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={() => activateSubscription(tenant.id, parseInt(subscriptionMonths))}
                          >
                            تفعيل الاشتراك
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
