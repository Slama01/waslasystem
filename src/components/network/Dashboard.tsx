import { Users, Router, DollarSign, AlertTriangle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { StatCard } from './StatCard';
import { DashboardStats, Subscriber, Sale } from '@/types/network';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface DashboardProps {
  stats: DashboardStats;
  subscribers: Subscriber[];
  sales: Sale[];
}

const COLORS = ['hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

export const Dashboard = ({ stats, subscribers, sales }: DashboardProps) => {
  const statusData = [
    { name: 'نشط', value: stats.activeSubscribers, color: COLORS[0] },
    { name: 'قارب على الانتهاء', value: stats.expiringSubscribers, color: COLORS[1] },
    { name: 'منتهي', value: stats.expiredSubscribers, color: COLORS[2] },
  ];

  const speedData = subscribers.reduce((acc, sub) => {
    const speed = `${sub.speed} Mbps`;
    const existing = acc.find(item => item.name === speed);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ name: speed, count: 1 });
    }
    return acc;
  }, [] as { name: string; count: number }[]);

  const salesByDate = sales.reduce((acc, sale) => {
    const existing = acc.find(item => item.date === sale.date);
    if (existing) {
      existing.amount += sale.price;
    } else {
      acc.push({ date: sale.date, amount: sale.price });
    }
    return acc;
  }, [] as { date: string; amount: number }[]).slice(-7);

  const expiringSubscribers = subscribers.filter(s => s.status === 'expiring');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي المشتركين"
          value={stats.totalSubscribers}
          icon={Users}
          color="primary"
          subtitle={`${stats.activeSubscribers} نشط`}
        />
        <StatCard
          title="الراوترات"
          value={stats.totalRouters}
          icon={Router}
          color="accent"
          subtitle={`${stats.onlineRouters} متصل`}
        />
        <StatCard
          title="إجمالي المبيعات"
          value={stats.totalSales}
          icon={DollarSign}
          color="success"
          subtitle="كرت مباع"
        />
        <StatCard
          title="الإيرادات"
          value={`${stats.totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          color="warning"
          subtitle="شيكل"
        />
      </div>

      {/* Alerts */}
      {expiringSubscribers.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-6 h-6 text-warning" />
            <h3 className="font-bold text-warning">تنبيه: اشتراكات قاربت على الانتهاء</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {expiringSubscribers.map(sub => (
              <div key={sub.id} className="bg-card rounded-lg p-3 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-warning animate-pulse" />
                <div>
                  <p className="font-medium">{sub.name}</p>
                  <p className="text-xs text-muted-foreground">ينتهي: {sub.expireDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pie Chart */}
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border/50">
          <h3 className="text-lg font-bold mb-4">حالة المشتركين</h3>
          <div className="h-64">
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
          <div className="flex justify-center gap-6 mt-4">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Speed Distribution */}
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border/50">
          <h3 className="text-lg font-bold mb-4">توزيع السرعات</h3>
          <div className="h-64">
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

        {/* Sales Trend */}
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border/50 lg:col-span-2">
          <h3 className="text-lg font-bold mb-4">مبيعات آخر 7 أيام</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesByDate}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(172, 66%, 50%)" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(172, 66%, 50%)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-3xl font-bold text-success">{stats.activeSubscribers}</p>
            <p className="text-sm text-muted-foreground">مشترك نشط</p>
          </div>
        </div>
        
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-3xl font-bold text-warning">{stats.expiringSubscribers}</p>
            <p className="text-sm text-muted-foreground">قارب على الانتهاء</p>
          </div>
        </div>
        
        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-3xl font-bold text-destructive">{stats.expiredSubscribers}</p>
            <p className="text-sm text-muted-foreground">منتهي</p>
          </div>
        </div>
      </div>
    </div>
  );
};
