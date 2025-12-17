import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sale } from '@/types/network';
import { Plus, Trash2, DollarSign, Package, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SalesPageProps {
  sales: Sale[];
  onAdd: (sale: Omit<Sale, 'id' | 'date'>) => void;
  onDelete: (id: string) => void;
}

export const SalesPage = ({ sales, onAdd, onDelete }: SalesPageProps) => {
  const [filter, setFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    type: 'retail' as 'wholesale' | 'retail',
    count: 0,
    price: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.count || !formData.price) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }
    onAdd(formData);
    setFormData({ type: 'retail', count: 0, price: 0 });
    toast.success('تم إضافة البيع بنجاح');
  };

  const handleDelete = (id: string) => {
    if (confirm('هل تريد حذف هذا البيع؟')) {
      onDelete(id);
      toast.success('تم حذف البيع');
    }
  };

  const filteredSales = sales.filter(sale => 
    filter === 'all' || sale.type === filter
  );

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.price, 0);
  const totalCards = filteredSales.reduce((acc, s) => acc + s.count, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg border-border/50 bg-gradient-to-br from-success/10 to-success/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-3xl font-bold">{totalRevenue.toLocaleString()} شيكل</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-border/50 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Package className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الكروت</p>
                <p className="text-3xl font-bold">{totalCards} كرت</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Form */}
      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            إضافة عملية بيع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={formData.type}
              onValueChange={(v) => setFormData({ ...formData, type: v as 'wholesale' | 'retail' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="نوع البيع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wholesale">جملة</SelectItem>
                <SelectItem value="retail">مفرق</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="عدد الكروت"
              value={formData.count || ''}
              onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 0 })}
            />
            <Input
              type="number"
              placeholder="السعر"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
            />
            <Button type="submit" className="gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 ml-2" />
              إضافة بيع
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex justify-end">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="تصفية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="wholesale">جملة</SelectItem>
            <SelectItem value="retail">مفرق</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sales List */}
      <div className="space-y-4">
        {filteredSales.map((sale, index) => (
          <Card 
            key={sale.id} 
            className="shadow-lg border-border/50 hover:shadow-xl transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    sale.type === 'wholesale' ? "bg-accent/20" : "bg-primary/20"
                  )}>
                    <Package className={cn(
                      "w-6 h-6",
                      sale.type === 'wholesale' ? "text-accent" : "text-primary"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-bold">{sale.type === 'wholesale' ? 'بيع جملة' : 'بيع مفرق'}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {sale.count} كرت
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {sale.date}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <p className="text-2xl font-bold text-success">{sale.price}</p>
                    <p className="text-xs text-muted-foreground">شيكل</p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(sale.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSales.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          لا يوجد مبيعات
        </div>
      )}
    </div>
  );
};
