import { 
  LayoutDashboard, 
  Users, 
  Router, 
  DollarSign, 
  UserCog, 
  Settings, 
  LogOut,
  Wifi
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Staff } from '@/types/network';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  currentUser: Staff;
  onLogout: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, roles: ['admin', 'subs', 'sales', 'routers'] },
  { id: 'subscribers', label: 'المشتركين', icon: Users, roles: ['admin', 'subs'] },
  { id: 'routers', label: 'الراوترات', icon: Router, roles: ['admin', 'routers'] },
  { id: 'sales', label: 'المبيعات', icon: DollarSign, roles: ['admin', 'sales'] },
  { id: 'staff', label: 'الموظفين', icon: UserCog, roles: ['admin'] },
  { id: 'settings', label: 'الإعدادات', icon: Settings, roles: ['admin'] },
];

export const Sidebar = ({ currentPage, onPageChange, currentUser, onLogout }: SidebarProps) => {
  const filteredMenu = menuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <aside className="fixed right-0 top-0 h-screen w-64 gradient-sidebar text-sidebar-foreground flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
            <Wifi className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">شبكة بلس</h1>
            <p className="text-xs text-sidebar-foreground/60">إدارة الشبكات</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent">
          <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold">
              {currentUser.name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium">{currentUser.name}</p>
            <p className="text-xs text-sidebar-foreground/60">
              {currentUser.role === 'admin' ? 'مدير' : 
               currentUser.role === 'subs' ? 'مشتركين' :
               currentUser.role === 'sales' ? 'مبيعات' : 'راوترات'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {filteredMenu.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onPageChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  currentPage === item.id
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                    : "hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
};
