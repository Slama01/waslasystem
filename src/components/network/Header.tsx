import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Clock, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps) => {
  const [time, setTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="bg-card border-b border-border px-3 sm:px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between">
      <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mr-12 lg:mr-0">{title}</h1>
      
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="w-8 h-8 lg:w-10 lg:h-10 rounded-full"
          title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 lg:w-5 lg:h-5 text-warning" />
          ) : (
            <Moon className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
          )}
        </Button>

        <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4 lg:w-5 lg:h-5" />
          <span className="font-mono text-xs lg:text-sm">{time.toLocaleTimeString('ar-EG')}</span>
        </div>
        
        <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${
          isOnline 
            ? 'bg-success/20 text-success' 
            : 'bg-destructive/20 text-destructive'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">متصل</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">غير متصل</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
