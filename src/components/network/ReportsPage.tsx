import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardStats, Subscriber, Payment, Sale } from '@/types/network';
import { FileText, TrendingUp, Users, Calendar, DollarSign, Printer, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface ReportsPageProps {
  subscribers: Subscriber[];
  payments: Payment[];
  sales: Sale[];
  stats: DashboardStats;
}

export const ReportsPage = ({ subscribers, payments, sales, stats }: ReportsPageProps) => {
  const reportRef = useRef<HTMLDivElement>(null);
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

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // Create a printable version and trigger print dialog with PDF option
    const printContent = reportRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>تقرير وصلة - ${currentMonthName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; 
              direction: rtl; 
              padding: 40px;
              background: white;
              color: #1a1a1a;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              padding-bottom: 20px;
              border-bottom: 3px solid #0ea5e9;
            }
            .header h1 { 
              font-size: 28px; 
              color: #0ea5e9;
              margin-bottom: 8px;
            }
            .header p { color: #666; }
            .stats-grid { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              gap: 20px; 
              margin-bottom: 30px; 
            }
            .stat-card { 
              padding: 20px; 
              border-radius: 12px; 
              text-align: center;
              border: 1px solid #e5e7eb;
            }
            .stat-card.income { background: #f0fdf4; border-color: #22c55e; }
            .stat-card.new { background: #eff6ff; border-color: #3b82f6; }
            .stat-card.expired { background: #fef2f2; border-color: #ef4444; }
            .stat-card.active { background: #f0fdfa; border-color: #14b8a6; }
            .stat-value { font-size: 32px; font-weight: bold; }
            .stat-label { font-size: 14px; color: #666; margin-top: 4px; }
            .section { margin-bottom: 30px; }
            .section-title { 
              font-size: 18px; 
              font-weight: bold; 
              margin-bottom: 15px;
              color: #333;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px;
            }
            th, td { 
              padding: 12px; 
              text-align: right; 
              border-bottom: 1px solid #e5e7eb;
            }
            th { 
              background: #f9fafb; 
              font-weight: 600;
              color: #374151;
            }
            .total-row { 
              background: #f0fdf4; 
              font-weight: bold;
            }
            .footer { 
              text-align: center; 
              margin-top: 40px; 
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; }
              .stat-card { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>وصلة - إدارة الشبكات</h1>
            <p>تقرير شهر ${currentMonthName}</p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card income">
              <div class="stat-value" style="color: #22c55e;">${totalMonthlyIncome.toLocaleString()}</div>
              <div class="stat-label">إجمالي الدخل (شيكل)</div>
            </div>
            <div class="stat-card new">
              <div class="stat-value" style="color: #3b82f6;">${newSubscribersThisMonth}</div>
              <div class="stat-label">اشتراكات جديدة</div>
            </div>
            <div class="stat-card expired">
              <div class="stat-value" style="color: #ef4444;">${expiredThisMonth}</div>
              <div class="stat-label">منتهية</div>
            </div>
            <div class="stat-card active">
              <div class="stat-value" style="color: #14b8a6;">${stats.activeSubscribers}</div>
              <div class="stat-label">المشتركين الفعالين</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">ملخص العمليات المالية</div>
            <table>
              <thead>
                <tr>
                  <th>النوع</th>
                  <th>العدد</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>تمديدات</td>
                  <td>${monthlyPayments.filter(p => p.type === 'extension').length}</td>
                  <td>${monthlyPayments.filter(p => p.type === 'extension').reduce((acc, p) => acc + p.amount, 0).toLocaleString()} شيكل</td>
                </tr>
                <tr>
                  <td>اشتراكات جديدة</td>
                  <td>${monthlyPayments.filter(p => p.type === 'subscription').length}</td>
                  <td>${monthlyPayments.filter(p => p.type === 'subscription').reduce((acc, p) => acc + p.amount, 0).toLocaleString()} شيكل</td>
                </tr>
                <tr>
                  <td>مبيعات كروت</td>
                  <td>${monthlySales.reduce((acc, s) => acc + s.count, 0)} كرت</td>
                  <td>${monthlySales.reduce((acc, s) => acc + s.price, 0).toLocaleString()} شيكل</td>
                </tr>
                <tr class="total-row">
                  <td>الإجمالي</td>
                  <td>-</td>
                  <td>${totalMonthlyIncome.toLocaleString()} شيكل</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>تم إنشاء هذا التقرير بواسطة نظام وصلة لإدارة الشبكات</p>
            <p>التاريخ: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="space-y-6 animate-fade-in" ref={reportRef}>
      {/* Month Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-6 border border-primary/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">تقرير شهر {currentMonthName}</h2>
              <p className="text-muted-foreground">ملخص الأداء والإحصائيات للشهر الحالي</p>
            </div>
          </div>
          <div className="flex gap-3 no-print">
            <Button onClick={handlePrint} variant="outline" className="gap-2">
              <Printer className="w-4 h-4" />
              طباعة
            </Button>
            <Button onClick={handleExportPDF} className="gap-2">
              <Download className="w-4 h-4" />
              تصدير PDF
            </Button>
          </div>
        </div>
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

      {/* Detailed Summary Table */}
      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <CardTitle>ملخص العمليات المالية التفصيلي</CardTitle>
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
                {/* New Subscriptions */}
                <tr className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary"></span>
                    اشتراكات جديدة
                  </td>
                  <td className="py-3 px-4">{monthlyPayments.filter(p => p.type === 'subscription').length}</td>
                  <td className="py-3 px-4 font-medium text-primary">
                    {monthlyPayments.filter(p => p.type === 'subscription').reduce((acc, p) => acc + p.amount, 0).toLocaleString()} شيكل
                  </td>
                </tr>
                {/* Extensions */}
                <tr className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-accent"></span>
                    تمديدات اشتراكات
                  </td>
                  <td className="py-3 px-4">{monthlyPayments.filter(p => p.type === 'extension').length}</td>
                  <td className="py-3 px-4 font-medium text-accent">
                    {monthlyPayments.filter(p => p.type === 'extension').reduce((acc, p) => acc + p.amount, 0).toLocaleString()} شيكل
                  </td>
                </tr>
                {/* Other Payments */}
                <tr className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-warning"></span>
                    دفعات أخرى
                  </td>
                  <td className="py-3 px-4">{monthlyPayments.filter(p => p.type === 'other').length}</td>
                  <td className="py-3 px-4 font-medium text-warning">
                    {monthlyPayments.filter(p => p.type === 'other').reduce((acc, p) => acc + p.amount, 0).toLocaleString()} شيكل
                  </td>
                </tr>
                {/* Wholesale Card Sales */}
                <tr className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                    بيع كروت - جملة
                  </td>
                  <td className="py-3 px-4">{monthlySales.filter(s => s.type === 'wholesale').reduce((acc, s) => acc + s.count, 0)} كرت</td>
                  <td className="py-3 px-4 font-medium text-purple-500">
                    {monthlySales.filter(s => s.type === 'wholesale').reduce((acc, s) => acc + s.price, 0).toLocaleString()} شيكل
                  </td>
                </tr>
                {/* Retail Card Sales */}
                <tr className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-success"></span>
                    بيع كروت - مفرق
                  </td>
                  <td className="py-3 px-4">{monthlySales.filter(s => s.type === 'retail').reduce((acc, s) => acc + s.count, 0)} كرت</td>
                  <td className="py-3 px-4 font-medium text-success">
                    {monthlySales.filter(s => s.type === 'retail').reduce((acc, s) => acc + s.price, 0).toLocaleString()} شيكل
                  </td>
                </tr>
                {/* Total */}
                <tr className="bg-muted/30 font-bold">
                  <td className="py-3 px-4">الإجمالي الكلي</td>
                  <td className="py-3 px-4">-</td>
                  <td className="py-3 px-4 text-success">{totalMonthlyIncome.toLocaleString()} شيكل</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Transactions List */}
      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            سجل العمليات المالية لهذا الشهر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            {[...monthlyPayments, ...monthlySales.map(s => ({
              id: s.id,
              date: s.date,
              type: s.type === 'wholesale' ? 'بيع جملة' : 'بيع مفرق',
              name: `${s.count} كرت`,
              amount: s.price,
              isSale: true
            }))].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item, index) => {
              const isPayment = 'subscriberName' in item;
              return (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      isPayment 
                        ? (item as Payment).type === 'subscription' 
                          ? "bg-primary/20" 
                          : (item as Payment).type === 'extension' 
                            ? "bg-accent/20" 
                            : "bg-warning/20"
                        : "bg-success/20"
                    )}>
                      <DollarSign className={cn(
                        "w-5 h-5",
                        isPayment 
                          ? (item as Payment).type === 'subscription' 
                            ? "text-primary" 
                            : (item as Payment).type === 'extension' 
                              ? "text-accent" 
                              : "text-warning"
                          : "text-success"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium">
                        {isPayment ? (item as Payment).subscriberName : (item as any).name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isPayment 
                          ? (item as Payment).type === 'subscription' 
                            ? 'اشتراك جديد' 
                            : (item as Payment).type === 'extension' 
                              ? 'تمديد اشتراك' 
                              : 'دفعة أخرى'
                          : (item as any).type
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-success">{(isPayment ? (item as Payment).amount : (item as any).amount).toLocaleString()} شيكل</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                </div>
              );
            })}
            {monthlyPayments.length === 0 && monthlySales.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                لا يوجد عمليات مالية لهذا الشهر
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
