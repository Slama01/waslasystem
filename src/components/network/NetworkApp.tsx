import { useState } from 'react';
import { useNetworkData } from '@/hooks/useNetworkData';
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

const pageTitles: Record<string, string> = {
  dashboard: 'لوحة التحكم',
  subscribers: 'إدارة المشتركين',
  routers: 'إدارة الراوترات',
  sales: 'إدارة المبيعات',
  staff: 'إدارة الموظفين',
  settings: 'الإعدادات',
  reports: 'التقارير الشهرية',
  activityLog: 'سجل النشاط',
};

export const NetworkApp = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
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
    deleteSubscriber,
    extendSubscription,
    addRouter,
    deleteRouter,
    addSale,
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
            onDelete={deleteSubscriber}
            onExtend={extendSubscription}
            getSubscriberPayments={getSubscriberPayments}
          />
        );
      case 'routers':
        return <RoutersPage routers={routers} onAdd={addRouter} onDelete={deleteRouter} />;
      case 'sales':
        return <SalesPage sales={sales} onAdd={addSale} onDelete={deleteSale} />;
      case 'staff':
        return <StaffPage staff={staff} onAdd={addStaff} onDelete={deleteStaff} />;
      case 'settings':
        return <SettingsPage onChangePassword={changePassword} />;
      case 'reports':
        return <ReportsPage subscribers={subscribers} payments={payments} sales={sales} stats={stats} />;
      case 'activityLog':
        return <ActivityLogPage activityLog={activityLog} />;
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
      />
      
      <main className="mr-64">
        <Header title={pageTitles[currentPage]} />
        <div className="p-6">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};
