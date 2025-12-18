import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats, Subscriber, Payment, Sale } from '@/types/network';
import { FileText, TrendingUp, Users, Calendar, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReportsPageProps {
  subscribers: Subscriber[];
  payments: Payment[];
  sales: Sale[];
  stats: DashboardStats;
}

export const ReportsPage = ({ subscribers, payments, sales, stats }: ReportsPageProps) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthName = new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });

  // Monthly stats
  const monthlyPayments = payments.filter(p => p.date.startsWith(currentMonth));
  const monthlySales = sales.filter(s => s.date.startsWith(currentMonth));
  
  const totalMonthlyIncome = monthlyPayments.reduce((acc, p) => acc + p.amount, 0) + 
                             monthlySales.reduce((acc, s) => acc + s.price, 0);
  
  const newSubscribersThisMonth = subscribers.filter(s => s.startDate.startsWith(currentMonth)).length;
  const expiredThisMonth = subscribers.filter(s => s.status === 'expired' && s.expireDate.startsWith(currentMonth)).length;
  
  // Last 6 months data
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return date.toISOString().slice(0, 7);
  });

  const monthlyData = last6Months.map(month => {
    const monthPayments = payments.filter(p => p.date.startsWith(month)).reduce((acc, p) => acc + p.amount, 0);
    const monthSales = sales.filter(s => s.date.startsWith(month)).reduce((acc, s) => acc + s.price, 0);
    const monthLabel = new Date(month + '-01').toLocaleDateString('ar-EG', { month: 'short' });
    
    return {
      month: monthLabel,
      income: monthPayments + monthSales,
      subscriptions: payments.filter(p => p.date.startsWith(month) && p.type === 'subscription').length,
      extensions: payments.filter(p => p.date.startsWith(month) && p.type === 'extension').length,
    };
  });

  // Speed distribution
  const speedDistribution = subscribers.reduce((acc, sub) => {
    const speed = sub.speed;
    acc[speed] = (acc[speed] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Month Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-6 border border-primary/20">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold">تقرير شهر {currentMonthName}</h2>
        </div>
        <p className="text-muted-foreground">ملخص الأداء والإحصائيات للشهر الحالي</p>
      </div>

      {/* Monthly Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg border-success/30 bg-success/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الدخل</p>
                <p className="text-3xl font-bold text-success">{totalMonthlyIncome.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">شيكل</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">اشتراكات جديدة</p>
                <p className="text-3xl font-bold text-primary">{newSubscribersThisMonth}</p>
                <p className="text-xs text-muted-foreground">مشترك</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-destructive/30 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-destructive/20 flex items-center justify-center">
                <Calendar className="w-7 h-7 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">منتهية</p>
                <p className="text-3xl font-bold text-destructive">{expiredThisMonth}</p>
                <p className="text-xs text-muted-foreground">اشتراك</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-accent/30 bg-accent/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المشتركين الفعالين</p>
                <p className="text-3xl font-bold text-accent">{stats.activeSubscribers}</p>
                <p className="text-xs text-muted-foreground">من {stats.totalSubscribers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income Chart */}
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              الدخل الشهري - آخر 6 أشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(value) => [`${value} شيكل`, 'الدخل']} />
                  <Bar dataKey="income" fill="hsl(142, 71%, 45%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Speed Distribution */}
        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              توزيع السرعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(speedDistribution)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([speed, count]) => {
                  const percentage = Math.round((count / subscribers.length) * 100);
                  return (
                    <div key={speed} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{speed} Mbps</span>
                        <span className="text-muted-foreground">{count} مشترك ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <CardTitle>ملخص العمليات المالية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">النوع</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">العدد</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">المبلغ</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-3 px-4">تمديدات</td>
                  <td className="py-3 px-4">{monthlyPayments.filter(p => p.type === 'extension').length}</td>
                  <td className="py-3 px-4 font-medium text-success">
                    {monthlyPayments.filter(p => p.type === 'extension').reduce((acc, p) => acc + p.amount, 0).toLocaleString()} شيكل
                  </td>
                </tr>
                <tr className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-3 px-4">اشتراكات جديدة</td>
                  <td className="py-3 px-4">{monthlyPayments.filter(p => p.type === 'subscription').length}</td>
                  <td className="py-3 px-4 font-medium text-success">
                    {monthlyPayments.filter(p => p.type === 'subscription').reduce((acc, p) => acc + p.amount, 0).toLocaleString()} شيكل
                  </td>
                </tr>
                <tr className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-3 px-4">مبيعات كروت</td>
                  <td className="py-3 px-4">{monthlySales.reduce((acc, s) => acc + s.count, 0)} كرت</td>
                  <td className="py-3 px-4 font-medium text-success">
                    {monthlySales.reduce((acc, s) => acc + s.price, 0).toLocaleString()} شيكل
                  </td>
                </tr>
                <tr className="bg-muted/30 font-bold">
                  <td className="py-3 px-4">الإجمالي</td>
                  <td className="py-3 px-4">-</td>
                  <td className="py-3 px-4 text-success">{totalMonthlyIncome.toLocaleString()} شيكل</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
