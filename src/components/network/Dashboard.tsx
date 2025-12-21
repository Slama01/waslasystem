import { Users, Router, DollarSign, AlertTriangle, CheckCircle, XCircle, TrendingUp, Gauge, Clock, Wallet, CalendarPlus, CalendarX, Ban } from 'lucide-react';
import { StatCard } from './StatCard';
import { DashboardStats, Subscriber, Sale, Payment } from '@/types/network';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { cn } from '@/lib/utils';

interface DashboardProps {
  stats: DashboardStats;
  subscribers: Subscriber[];
  sales: Sale[];
  payments: Payment[];
  alerts: Subscriber[];
}

const COLORS = ['hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(210, 15%, 45%)', 'hsl(270, 60%, 50%)'];

export const Dashboard = ({ stats, subscribers, sales, payments, alerts }: DashboardProps) => {
  const statusData = [
    { name: 'فعّال', value: stats.activeSubscribers, color: COLORS[0] },
    { name: 'قرب الانتهاء', value: stats.expiringSubscribers, color: COLORS[1] },
    { name: 'منتهي', value: stats.expiredSubscribers, color: COLORS[2] },
    { name: 'موقوف', value: stats.stoppedSubscribers, color: COLORS[3] },
    { name: 'مديون', value: stats.indebtedSubscribers, color: COLORS[4] },
  ].filter(item => item.value > 0);

  const speedData = subscribers.reduce((acc, sub) => {
    const speed = `${sub.speed} Mbps`;
    const existing = acc.find(item => item.name === speed);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ name: speed, count: 1 });
    }
    return acc;
  }, [] as { name: string; count: number }[]).sort((a, b) => parseInt(a.name) - parseInt(b.name));

  // Calculate daily revenue for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const revenueByDate = last7Days.map(date => {
    const dayPayments = payments.filter(p => p.date === date).reduce((acc, p) => acc + p.amount, 0);
    const daySales = sales.filter(s => s.date === date).reduce((acc, s) => acc + s.price, 0);
    return {
      date: date.slice(5), // MM-DD format
      amount: dayPayments + daySales
    };
  });

  const getAlertIcon = (sub: Subscriber) => {
    if (sub.daysLeft === undefined) return '⚠️';
    if (sub.daysLeft < 0) return '🔴';
    if (sub.daysLeft === 0) return '⚠️';
    if (sub.daysLeft === 1) return '⚠️';
    if (sub.daysLeft <= 3) return '🟠';
    return '🟡';
  };

  const getAlertMessage = (sub: Subscriber) => {
    if (sub.status === 'indebted') return `مديون ${sub.balance} شيكل`;
    if (sub.daysLeft === undefined) return '';
    if (sub.daysLeft < 0) return `منتهي منذ ${Math.abs(sub.daysLeft)} يوم`;
    if (sub.daysLeft === 0) return 'ينتهي اليوم!';
    if (sub.daysLeft === 1) return 'باقي يوم واحد';
    return `باقي ${sub.daysLeft} أيام`;
  };

  return (
    <div className="space-y-4 lg:space-y-6 animate-fade-in">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <StatCard
          title="إجمالي المشتركين"
          value={stats.totalSubscribers}
          icon={Users}
          color="primary"
          subtitle={`${stats.activeSubscribers} فعّال`}
        />
        <StatCard
          title="دخل اليوم"
          value={`${stats.todayRevenue.toLocaleString()}`}
          icon={Wallet}
          color="success"
          subtitle="شيكل"
        />
        <StatCard
          title="قرب الانتهاء"
          value={stats.expiringSubscribers}
          icon={Clock}
          color="warning"
          subtitle="مشترك"
        />
        <StatCard
          title="متوسط السرعة"
          value={`${stats.averageSpeed}`}
          icon={Gauge}
          color="accent"
          subtitle="Mbps"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <StatCard
          title="دخل الشهر"
          value={`${stats.monthlyRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="success"
          subtitle="شيكل"
        />
        <StatCard
          title="اشتراكات جديدة"
          value={stats.newSubscribersThisMonth}
          icon={CalendarPlus}
          color="primary"
          subtitle="هذا الشهر"
        />
        <StatCard
          title="منتهية هذا الشهر"
          value={stats.expiredThisMonth}
          icon={CalendarX}
          color="destructive"
          subtitle="اشتراك"
        />
        <StatCard
          title="الراوترات"
          value={stats.totalRouters}
          icon={Router}
          color="accent"
          subtitle={`${stats.onlineRouters} متصل`}
        />
      </div>

      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div className="bg-gradient-to-r from-warning/10 to-destructive/10 border border-warning/30 rounded-xl p-3 lg:p-5 animate-slide-up">
          <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
            <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-warning" />
            <h3 className="font-bold text-base lg:text-lg">تنبيهات ذكية ({alerts.length})</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3 max-h-60 overflow-y-auto">
            {alerts.map(sub => (
              <div 
                key={sub.id} 
                className={cn(
                  "bg-card rounded-lg p-3 flex items-center gap-3 border",
                  sub.status === 'expired' && "border-destructive/30",
                  sub.status === 'expiring' && "border-warning/30",
                  sub.status === 'indebted' && "border-purple-500/30"
                )}
              >
                <span className="text-xl">{getAlertIcon(sub)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{sub.name}</p>
                  <p className={cn(
                    "text-xs font-bold",
                    sub.status === 'expired' && "text-destructive",
                    sub.status === 'expiring' && "text-warning",
                    sub.status === 'indebted' && "text-purple-500"
                  )}>
                    {getAlertMessage(sub)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Status Pie Chart */}
        <div className="bg-card rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg border border-border/50">
          <h3 className="text-base lg:text-lg font-bold mb-3 lg:mb-4">حالة المشتركين</h3>
          <div className="h-48 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Speed Distribution */}
        <div className="bg-card rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg border border-border/50">
          <h3 className="text-base lg:text-lg font-bold mb-3 lg:mb-4">توزيع السرعات</h3>
          <div className="h-48 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={speedData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(199, 89%, 48%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-card rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg border border-border/50 lg:col-span-2">
          <h3 className="text-base lg:text-lg font-bold mb-3 lg:mb-4">الدخل - آخر 7 أيام</h3>
          <div className="h-48 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueByDate}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(142, 71%, 45%)" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(142, 71%, 45%)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        <div className="bg-card rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-lg border border-border/50 flex items-center gap-2 lg:gap-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-success" />
          </div>
          <div>
            <p className="text-xl lg:text-2xl font-bold text-success">{stats.activeSubscribers}</p>
            <p className="text-xs text-muted-foreground">فعّال</p>
          </div>
        </div>
        
        <div className="bg-card rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-lg border border-border/50 flex items-center gap-2 lg:gap-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-warning/20 flex items-center justify-center">
            <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-warning" />
          </div>
          <div>
            <p className="text-xl lg:text-2xl font-bold text-warning">{stats.expiringSubscribers}</p>
            <p className="text-xs text-muted-foreground">قرب الانتهاء</p>
          </div>
        </div>
        
        <div className="bg-card rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-lg border border-border/50 flex items-center gap-2 lg:gap-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-destructive/20 flex items-center justify-center">
            <XCircle className="w-4 h-4 lg:w-5 lg:h-5 text-destructive" />
          </div>
          <div>
            <p className="text-xl lg:text-2xl font-bold text-destructive">{stats.expiredSubscribers}</p>
            <p className="text-xs text-muted-foreground">منتهي</p>
          </div>
        </div>

        <div className="bg-card rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-lg border border-border/50 flex items-center gap-2 lg:gap-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-muted flex items-center justify-center">
            <Ban className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xl lg:text-2xl font-bold">{stats.stoppedSubscribers}</p>
            <p className="text-xs text-muted-foreground">موقوف</p>
          </div>
        </div>

        <div className="bg-card rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-lg border border-border/50 flex items-center gap-2 lg:gap-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <DollarSign className="w-4 h-4 lg:w-5 lg:h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-xl lg:text-2xl font-bold text-purple-500">{stats.indebtedSubscribers}</p>
            <p className="text-xs text-muted-foreground">مديون</p>
          </div>
        </div>
      </div>
    </div>
  );
};
