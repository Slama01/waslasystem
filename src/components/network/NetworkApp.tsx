import { useState } from 'react';
import { useNetworkData } from '@/hooks/useNetworkData';
import { useAuth } from '@/hooks/useAuth';
import { LoginPage } from './LoginPage';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Dashboard } from './Dashboard';
import { SubscribersPage } from './SubscribersPage';
import { RoutersPage } from './RoutersPage';
import { SalesPage } from './SalesPage';
import { StaffPage } from './StaffPage';
import { SettingsPage } from './SettingsPage';
import { ReportsPage } from './ReportsPage';
import { ActivityLogPage } from './ActivityLogPage';
import { PackagesPage } from './PackagesPage';
import { TenantsManagementPage } from './TenantsManagementPage';
import { TrialExpiryAlert } from './TrialExpiryAlert';

const pageTitles: Record<string, string> = {
  dashboard: 'لوحة التحكم',
  subscribers: 'إدارة المشتركين',
  packages: 'إدارة الباقات',
  routers: 'إدارة الراوترات',
  sales: 'إدارة المبيعات',
  staff: 'إدارة الموظفين',
  settings: 'الإعدادات',
  reports: 'التقارير الشهرية',
  activityLog: 'سجل النشاط',
  tenants: 'إدارة أصحاب الشبكات',
};

export const NetworkApp = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { isSuperAdmin } = useAuth();
  const {
    subscribers,
    routers,
    sales,
    staff,
    payments,
    activityLog,
    stats,
    currentUser,
    addSubscriber,
    updateSubscriber,
    deleteSubscriber,
    extendSubscription,
    addRouter,
    updateRouter,
    deleteRouter,
    addSale,
    updateSale,
    deleteSale,
    addStaff,
    deleteStaff,
    getSubscriberPayments,
    login,
    logout,
    changePassword,
    getAlerts,
  } = useNetworkData();

  if (!currentUser) {
    return <LoginPage onLogin={login} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard stats={stats} subscribers={subscribers} sales={sales} payments={payments} alerts={getAlerts()} />;
      case 'subscribers':
        return (
          <SubscribersPage 
            subscribers={subscribers} 
            staff={staff}
            onAdd={addSubscriber} 
            onUpdate={updateSubscriber}
            onDelete={deleteSubscriber}
            onExtend={extendSubscription}
            getSubscriberPayments={getSubscriberPayments}
          />
        );
      case 'packages':
        return <PackagesPage />;
      case 'routers':
        return <RoutersPage routers={routers} onAdd={addRouter} onUpdate={updateRouter} onDelete={deleteRouter} />;
      case 'sales':
        return <SalesPage sales={sales} onAdd={addSale} onUpdate={updateSale} onDelete={deleteSale} />;
      case 'staff':
        return <StaffPage staff={staff} onAdd={addStaff} onDelete={deleteStaff} />;
      case 'settings':
        return <SettingsPage onChangePassword={changePassword} />;
      case 'reports':
        return <ReportsPage subscribers={subscribers} payments={payments} sales={sales} stats={stats} />;
      case 'activityLog':
        return <ActivityLogPage activityLog={activityLog} />;
      case 'tenants':
        return <TenantsManagementPage />;
      default:
        return <Dashboard stats={stats} subscribers={subscribers} sales={sales} payments={payments} alerts={getAlerts()} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
        currentUser={currentUser}
        onLogout={logout}
        isSuperAdmin={isSuperAdmin}
      />
      
      <main className="lg:mr-64">
        <Header title={pageTitles[currentPage]} />
        <div className="p-3 sm:p-4 lg:p-6">
          <TrialExpiryAlert />
          {renderPage()}
        </div>
      </main>
    </div>
  );
};
