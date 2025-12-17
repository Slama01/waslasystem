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

const pageTitles: Record<string, string> = {
  dashboard: 'لوحة التحكم',
  subscribers: 'إدارة المشتركين',
  routers: 'إدارة الراوترات',
  sales: 'إدارة المبيعات',
  staff: 'إدارة الموظفين',
  settings: 'الإعدادات',
};

export const NetworkApp = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const {
    subscribers,
    routers,
    sales,
    staff,
    stats,
    currentUser,
    addSubscriber,
    deleteSubscriber,
    addRouter,
    deleteRouter,
    addSale,
    deleteSale,
    addStaff,
    deleteStaff,
    login,
    logout,
    changePassword,
  } = useNetworkData();

  if (!currentUser) {
    return <LoginPage onLogin={login} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard stats={stats} subscribers={subscribers} sales={sales} />;
      case 'subscribers':
        return <SubscribersPage subscribers={subscribers} onAdd={addSubscriber} onDelete={deleteSubscriber} />;
      case 'routers':
        return <RoutersPage routers={routers} onAdd={addRouter} onDelete={deleteRouter} />;
      case 'sales':
        return <SalesPage sales={sales} onAdd={addSale} onDelete={deleteSale} />;
      case 'staff':
        return <StaffPage staff={staff} onAdd={addStaff} onDelete={deleteStaff} />;
      case 'settings':
        return <SettingsPage onChangePassword={changePassword} />;
      default:
        return <Dashboard stats={stats} subscribers={subscribers} sales={sales} />;
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
