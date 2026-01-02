import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTenantData } from '@/hooks/useTenantData';
import { Sidebar } from '@/components/network/Sidebar';
import { Header } from '@/components/network/Header';
import { Dashboard } from '@/components/network/Dashboard';
import { SubscribersPage } from '@/components/network/SubscribersPage';
import { RoutersPage } from '@/components/network/RoutersPage';
import { SalesPage } from '@/components/network/SalesPage';
import { SettingsPage } from '@/components/network/SettingsPage';
import { ReportsPage } from '@/components/network/ReportsPage';
import { ActivityLogPage } from '@/components/network/ActivityLogPage';
import { Loader2 } from 'lucide-react';

const pageTitles: Record<string, string> = {
  dashboard: 'لوحة التحكم',
  subscribers: 'إدارة المشتركين',
  routers: 'إدارة الراوترات',
  sales: 'إدارة المبيعات',
  settings: 'الإعدادات',
  reports: 'التقارير الشهرية',
  activityLog: 'سجل النشاط',
};

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { profile, signOut, isOwner } = useAuth();
  const { 
    subscribers, 
    routers, 
    sales, 
    payments,
    activityLog,
    stats, 
    isLoading,
    addSubscriber,
    updateSubscriber,
    deleteSubscriber,
    addRouter,
    updateRouter,
    deleteRouter,
    addSale,
  } = useTenantData();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  const currentUser = {
    id: profile?.id || '',
    name: profile?.full_name || '',
    password: '',
    role: isOwner ? 'admin' : 'staff',
  };

  // Map subscribers to old format for compatibility
  const mappedSubscribers = subscribers.map(s => ({
    id: s.id,
    name: s.name,
    phone: s.phone || '',
    devices: 1,
    startDate: s.start_date || '',
    expireDate: s.end_date || '',
    type: 'monthly' as const,
    speed: 0,
    status: (s.daysLeft ?? 0) < 0 ? 'expired' : (s.daysLeft ?? 0) <= 3 ? 'expiring' : 'active' as any,
    notes: s.notes || '',
    daysLeft: s.daysLeft,
    balance: 0,
  }));

  // Map routers to old format
  const mappedRouters = routers.map(r => ({
    id: r.id,
    name: r.name,
    model: '',
    location: r.location || '',
    status: r.status === 'active' ? 'online' : 'offline' as any,
    ip: r.ip_address || '',
    subscribersCount: r.used_ports,
  }));

  // Map sales to old format
  const mappedSales = sales.map(s => ({
    id: s.id,
    type: s.type as any,
    count: s.count || 1,
    price: s.amount,
    date: s.created_at.split('T')[0],
  }));

  // Map payments to old format
  const mappedPayments = payments.map(p => ({
    id: p.id,
    subscriberId: p.subscriber_id,
    subscriberName: subscribers.find(s => s.id === p.subscriber_id)?.name || '',
    amount: p.amount,
    date: p.payment_date,
    staffName: profile?.full_name || '',
    type: 'subscription' as const,
    notes: p.notes || '',
  }));

  // Map activity log
  const mappedActivityLog = activityLog.map(a => ({
    id: a.id,
    action: a.action as any,
    entityType: a.entity_type as any,
    entityName: a.details?.name || '',
    staffName: profile?.full_name || '',
    timestamp: a.created_at,
    details: typeof a.details === 'string' ? a.details : JSON.stringify(a.details),
  }));

  const getAlerts = () => {
    return mappedSubscribers.filter(s => s.status === 'expiring' || s.status === 'expired');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            stats={{
              ...stats,
              stoppedSubscribers: 0,
              indebtedSubscribers: 0,
              totalSales: sales.length,
              todayRevenue: 0,
              newSubscribersThisMonth: 0,
              expiredThisMonth: 0,
              averageSpeed: 0,
            }} 
            subscribers={mappedSubscribers} 
            sales={mappedSales} 
            payments={mappedPayments} 
            alerts={getAlerts()} 
          />
        );
      case 'subscribers':
        return (
          <SubscribersPage 
            subscribers={mappedSubscribers} 
            staff={[]}
            onAdd={async (sub, payment) => {
              await addSubscriber({
                name: sub.name,
                phone: sub.phone,
                start_date: sub.startDate,
                end_date: sub.expireDate,
                notes: sub.notes,
                package_price: payment || 0,
              });
            }} 
            onUpdate={async (id, data) => {
              await updateSubscriber(id, {
                name: data.name,
                phone: data.phone,
                end_date: data.expireDate,
                notes: data.notes,
              });
            }}
            onDelete={deleteSubscriber}
            onExtend={async () => {}}
            getSubscriberPayments={() => []}
          />
        );
      case 'routers':
        return (
          <RoutersPage 
            routers={mappedRouters} 
            onAdd={async (r) => {
              await addRouter({
                name: r.name,
                ip_address: r.ip,
                location: r.location,
                status: r.status === 'online' ? 'active' : 'inactive',
              });
            }} 
            onUpdate={async (id, data) => {
              await updateRouter(id, {
                name: data.name,
                ip_address: data.ip,
                location: data.location,
                status: data.status === 'online' ? 'active' : 'inactive',
              });
            }} 
            onDelete={deleteRouter} 
          />
        );
      case 'sales':
        return (
          <SalesPage 
            sales={mappedSales} 
            onAdd={async (s) => {
              await addSale({
                amount: s.price,
                count: s.count,
                type: s.type,
              });
            }} 
            onUpdate={async () => {}} 
            onDelete={async () => {}} 
          />
        );
      case 'settings':
        return <SettingsPage onChangePassword={async () => false} />;
      case 'reports':
        return (
          <ReportsPage 
            subscribers={mappedSubscribers} 
            payments={mappedPayments} 
            sales={mappedSales} 
            stats={{
              ...stats,
              stoppedSubscribers: 0,
              indebtedSubscribers: 0,
              totalSales: sales.length,
              todayRevenue: 0,
              newSubscribersThisMonth: 0,
              expiredThisMonth: 0,
              averageSpeed: 0,
            }} 
          />
        );
      case 'activityLog':
        return <ActivityLogPage activityLog={mappedActivityLog} />;
      default:
        return (
          <Dashboard 
            stats={{
              ...stats,
              stoppedSubscribers: 0,
              indebtedSubscribers: 0,
              totalSales: sales.length,
              todayRevenue: 0,
              newSubscribersThisMonth: 0,
              expiredThisMonth: 0,
              averageSpeed: 0,
            }} 
            subscribers={mappedSubscribers} 
            sales={mappedSales} 
            payments={mappedPayments} 
            alerts={getAlerts()} 
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
        currentUser={currentUser as any}
        onLogout={signOut}
      />
      
      <main className="lg:mr-64">
        <Header title={pageTitles[currentPage]} />
        <div className="p-3 sm:p-4 lg:p-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default Index;
