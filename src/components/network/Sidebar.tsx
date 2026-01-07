import { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Router, 
  DollarSign, 
  Settings, 
  LogOut,
  Wifi,
  FileText,
  Activity,
  Menu,
  X,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Staff } from '@/types/network';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  currentUser: Staff;
  onLogout: () => void;
  isSuperAdmin?: boolean;
}

const menuItems = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, roles: ['admin', 'subs', 'sales', 'routers', 'subs_sales'] },
  { id: 'subscribers', label: 'المشتركين', icon: Users, roles: ['admin', 'subs', 'subs_sales'] },
  { id: 'routers', label: 'الراوترات', icon: Router, roles: ['admin', 'routers'] },
  { id: 'sales', label: 'المبيعات', icon: DollarSign, roles: ['admin', 'sales', 'subs_sales'] },
  { id: 'reports', label: 'التقارير', icon: FileText, roles: ['admin'] },
  { id: 'activityLog', label: 'سجل النشاط', icon: Activity, roles: ['admin'] },
  { id: 'settings', label: 'الإعدادات', icon: Settings, roles: ['admin'] },
];

const SidebarContent = ({ 
  currentPage, 
  onPageChange, 
  currentUser, 
  onLogout,
  onItemClick,
  isSuperAdmin
}: SidebarProps & { onItemClick?: () => void }) => {
  // Add tenants page for super admins
  const superAdminItems = isSuperAdmin ? [
    { id: 'tenants', label: 'أصحاب الشبكات', icon: Building2, roles: ['admin', 'subs', 'sales', 'routers', 'subs_sales'] },
  ] : [];

  const filteredMenu = [...menuItems, ...superAdminItems].filter(item => item.roles.includes(currentUser.role));

  const handlePageChange = (page: string) => {
    onPageChange(page);
    onItemClick?.();
  };

  return (
    <>
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 lg:w-12 lg:h-12 gradient-primary rounded-xl flex items-center justify-center">
            <Wifi className="w-5 h-5 lg:w-7 lg:h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-bold">وصلة</h1>
            <p className="text-xs text-sidebar-foreground/60">إدارة الشبكات</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-3 lg:p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 p-2 lg:p-3 rounded-lg bg-sidebar-accent">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-sm lg:text-base">
              {currentUser.name.charAt(0)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm lg:text-base truncate">{currentUser.name}</p>
            <p className="text-xs text-sidebar-foreground/60">
              {currentUser.role === 'admin' ? 'مدير' : 
               currentUser.role === 'subs' ? 'مشتركين' :
               currentUser.role === 'sales' ? 'مبيعات' : 
               currentUser.role === 'subs_sales' ? 'مشتركين ومبيعات' : 'راوترات'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 lg:p-4 overflow-y-auto">
        <ul className="space-y-1 lg:space-y-2">
          {filteredMenu.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handlePageChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200",
                  currentPage === item.id
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                    : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm lg:text-base">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-3 lg:p-4 border-t border-sidebar-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm lg:text-base">تسجيل الخروج</span>
        </button>
      </div>
    </>
  );
};

export const Sidebar = ({ currentPage, onPageChange, currentUser, onLogout, isSuperAdmin }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="fixed top-3 right-3 z-50 lg:hidden bg-card shadow-lg border border-border"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[280px] p-0 gradient-sidebar text-sidebar-foreground">
          <SidebarContent 
            currentPage={currentPage}
            onPageChange={onPageChange}
            currentUser={currentUser}
            onLogout={onLogout}
            onItemClick={() => setIsOpen(false)}
            isSuperAdmin={isSuperAdmin}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed right-0 top-0 h-screen w-64 gradient-sidebar text-sidebar-foreground flex-col z-40">
        <SidebarContent 
          currentPage={currentPage}
          onPageChange={onPageChange}
          currentUser={currentUser}
          onLogout={onLogout}
          isSuperAdmin={isSuperAdmin}
        />
      </aside>
    </>
  );
};
