import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Clock } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps) => {
  const [time, setTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
    <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-5 h-5" />
          <span className="font-mono text-sm">{time.toLocaleTimeString('ar-EG')}</span>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          isOnline 
            ? 'bg-success/20 text-success' 
            : 'bg-destructive/20 text-destructive'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>متصل</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>غير متصل</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
