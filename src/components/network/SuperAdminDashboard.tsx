import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

export const SuperAdminDashboard = () => {
  const { tenants, isLoading } = useSuperAdmin();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeTenants = tenants.filter(t => t.is_active);
  const trialTenants = tenants.filter(t => t.subscription_status === 'trial');
  const subscribedTenants = tenants.filter(t => t.subscription_status === 'active');
  const inactiveTenants = tenants.filter(t => !t.is_active);

  // Calculate tenants with trials expiring in next 7 days
  const expiringTrials = tenants.filter(t => {
    if (t.subscription_status !== 'trial' || !t.subscription_ends_at) return false;
    const daysLeft = Math.ceil((new Date(t.subscription_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 7;
  });

  const totalSubscribers = tenants.reduce((acc, t) => acc + (t.subscribers_count || 0), 0);

  const stats = [
    {
      title: 'إجمالي الشبكات',
      value: tenants.length,
      icon: Building2,
      color: 'from-blue-500 to-blue-600',
      description: 'جميع الشبكات المسجلة',
    },
    {
      title: 'الشبكات النشطة',
      value: activeTenants.length,
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      description: 'شبكات تعمل حالياً',
    },
    {
      title: 'اشتراكات تجريبية',
      value: trialTenants.length,
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      description: 'في فترة التجربة',
    },
    {
      title: 'اشتراكات مدفوعة',
      value: subscribedTenants.length,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      description: 'اشتراكات فعّالة',
    },
    {
      title: 'شبكات متوقفة',
      value: inactiveTenants.length,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      description: 'تحتاج مراجعة',
    },
    {
      title: 'إجمالي المشتركين',
      value: totalSubscribers,
      icon: Users,
      color: 'from-cyan-500 to-cyan-600',
      description: 'عبر جميع الشبكات',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expiring Trials Alert */}
      {expiringTrials.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              تجارب تنتهي قريباً ({expiringTrials.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringTrials.map((tenant) => {
                const daysLeft = Math.ceil(
                  (new Date(tenant.subscription_ends_at!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={tenant.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-sm text-muted-foreground">{tenant.owner_email}</p>
                    </div>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {daysLeft} {daysLeft === 1 ? 'يوم' : 'أيام'} متبقية
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Tenants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            أحدث الشبكات المسجلة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tenants.slice(0, 5).map((tenant) => (
              <div key={tenant.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">
                      {tenant.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{tenant.name}</p>
                    <p className="text-sm text-muted-foreground">{tenant.subscribers_count || 0} مشترك</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                    tenant.subscription_status === 'active' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : tenant.subscription_status === 'trial'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {tenant.subscription_status === 'active' ? 'مشترك' : 
                     tenant.subscription_status === 'trial' ? 'تجريبي' : 'منتهي'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
