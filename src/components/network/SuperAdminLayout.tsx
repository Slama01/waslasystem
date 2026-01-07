import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SuperAdminSidebar } from './SuperAdminSidebar';
import { Header } from './Header';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { TenantsManagementPage } from './TenantsManagementPage';
import { SuperAdminSettingsPage } from './SuperAdminSettingsPage';

const pageTitles: Record<string, string> = {
  dashboard: 'لوحة التحكم',
  tenants: 'إدارة أصحاب الشبكات',
  settings: 'الإعدادات',
};

export const SuperAdminLayout = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { profile, signOut } = useAuth();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <SuperAdminDashboard />;
      case 'tenants':
        return <TenantsManagementPage />;
      case 'settings':
        return <SuperAdminSettingsPage />;
      default:
        return <SuperAdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SuperAdminSidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
        userName={profile?.full_name || 'مدير عام'}
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
