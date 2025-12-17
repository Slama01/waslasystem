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
    <div className="bg-card rounded-2xl p-6 shadow-lg border border-border/50 hover:shadow-xl transition-all duration-300 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="text-4xl font-bold text-card-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg",
          colorClasses[color]
        )}>
          <Icon className="w-7 h-7 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
};
