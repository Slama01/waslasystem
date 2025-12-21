import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'accent';
  subtitle?: string;
}

const colorClasses = {
  primary: 'from-primary to-primary/80',
  success: 'from-success to-success/80',
  warning: 'from-warning to-warning/80',
  destructive: 'from-destructive to-destructive/80',
  accent: 'from-accent to-accent/80',
};

export const StatCard = ({ title, value, icon: Icon, color = 'primary', subtitle }: StatCardProps) => {
  return (
    <div className="bg-card rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-border/50 hover:shadow-xl transition-all duration-300 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 lg:space-y-2 min-w-0 flex-1">
          <p className="text-muted-foreground text-xs lg:text-sm truncate">{title}</p>
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-card-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg flex-shrink-0",
          colorClasses[color]
        )}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
};
