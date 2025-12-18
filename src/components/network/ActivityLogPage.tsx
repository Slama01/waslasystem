import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityLog } from '@/types/network';
import { Activity, UserPlus, UserMinus, RefreshCw, Edit, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityLogPageProps {
  activityLog: ActivityLog[];
}

const actionConfig = {
  add: { icon: UserPlus, color: 'text-success', bgColor: 'bg-success/20', label: 'إضافة' },
  extend: { icon: RefreshCw, color: 'text-primary', bgColor: 'bg-primary/20', label: 'تمديد' },
  delete: { icon: UserMinus, color: 'text-destructive', bgColor: 'bg-destructive/20', label: 'حذف' },
  edit: { icon: Edit, color: 'text-warning', bgColor: 'bg-warning/20', label: 'تعديل' },
  payment: { icon: CreditCard, color: 'text-accent', bgColor: 'bg-accent/20', label: 'دفعة' },
};

const entityLabels = {
  subscriber: 'مشترك',
  router: 'راوتر',
  sale: 'مبيعات',
  staff: 'موظف',
};

export const ActivityLogPage = ({ activityLog }: ActivityLogPageProps) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupByDate = (logs: ActivityLog[]) => {
    const groups: Record<string, ActivityLog[]> = {};
    
    logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
    });
    
    return groups;
  };

  const groupedLogs = groupByDate(activityLog);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-6 border border-primary/20">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold">سجل النشاط</h2>
        </div>
        <p className="text-muted-foreground">سجل جميع العمليات والتغييرات في النظام</p>
      </div>

      {/* Activity Log */}
      {activityLog.length === 0 ? (
        <Card className="shadow-lg border-border/50">
          <CardContent className="py-12 text-center">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لا يوجد نشاط مسجل بعد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedLogs).map(([date, logs]) => (
            <Card key={date} className="shadow-lg border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-muted-foreground">{date}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {logs.map((log, index) => {
                  const config = actionConfig[log.action];
                  const Icon = config.icon;
                  
                  return (
                    <div 
                      key={log.id}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors",
                        index === 0 && "animate-slide-up"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", config.bgColor)}>
                        <Icon className={cn("w-5 h-5", config.color)} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", config.bgColor, config.color)}>
                            {config.label}
                          </span>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                            {entityLabels[log.entityType]}
                          </span>
                        </div>
                        
                        <p className="font-medium mt-1">
                          {config.label} {entityLabels[log.entityType]}: <span className="text-primary">{log.entityName}</span>
                        </p>
                        
                        {log.details && (
                          <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                        )}
                        
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>بواسطة: {log.staffName}</span>
                          <span>•</span>
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
