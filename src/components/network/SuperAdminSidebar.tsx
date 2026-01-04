import { useState } from 'react';
import { 
  LayoutDashboard, 
  Building2,
  LogOut,
  Menu,
  Shield,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface SuperAdminSidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  userName: string;
  onLogout: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { id: 'tenants', label: 'أصحاب الشبكات', icon: Building2 },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

const SidebarContent = ({ 
  currentPage, 
  onPageChange, 
  userName,
  onLogout,
  onItemClick,
}: SuperAdminSidebarProps & { onItemClick?: () => void }) => {

  const handlePageChange = (page: string) => {
    onPageChange(page);
    onItemClick?.();
  };

  return (
    <>
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-bold">وصلة</h1>
            <p className="text-xs text-sidebar-foreground/60">لوحة المدير العام</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-3 lg:p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 p-2 lg:p-3 rounded-lg bg-sidebar-accent">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm lg:text-base">
              {userName.charAt(0)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm lg:text-base truncate">{userName}</p>
            <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600 dark:text-amber-400">
              مدير عام
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 lg:p-4 overflow-y-auto">
        <ul className="space-y-1 lg:space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handlePageChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-200",
                  currentPage === item.id
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg"
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

export const SuperAdminSidebar = ({ currentPage, onPageChange, userName, onLogout }: SuperAdminSidebarProps) => {
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
            userName={userName}
            onLogout={onLogout}
            onItemClick={() => setIsOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed right-0 top-0 h-screen w-64 gradient-sidebar text-sidebar-foreground flex-col z-40">
        <SidebarContent 
          currentPage={currentPage}
          onPageChange={onPageChange}
          userName={userName}
          onLogout={onLogout}
        />
      </aside>
    </>
  );
};
