import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Staff } from '@/types/network';
import { Plus, Trash2, UserCog, Shield, ShoppingCart, Users, Router } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StaffPageProps {
  staff: Staff[];
  onAdd: (member: Omit<Staff, 'id'>) => void;
  onDelete: (id: string) => void;
}

const roleLabels: Record<string, string> = {
  admin: 'مدير',
  subs: 'مشتركين',
  sales: 'مبيعات',
  routers: 'راوترات',
  subs_sales: 'مشتركين ومبيعات',
};

const roleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  admin: Shield,
  subs: Users,
  sales: ShoppingCart,
  routers: Router,
  subs_sales: Users,
};

const roleColors: Record<string, string> = {
  admin: 'bg-primary/20 text-primary',
  subs: 'bg-accent/20 text-accent',
  sales: 'bg-success/20 text-success',
  routers: 'bg-warning/20 text-warning',
  subs_sales: 'bg-purple-500/20 text-purple-500',
};

export const StaffPage = ({ staff, onAdd, onDelete }: StaffPageProps) => {
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    role: 'subs' as Staff['role'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.password) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }
    onAdd(formData);
    setFormData({ name: '', password: '', role: 'subs' });
    toast.success('تم إضافة الموظف بنجاح');
  };

  const handleDelete = (id: string, role: string) => {
    if (role === 'admin') {
      toast.error('لا يمكن حذف المدير');
      return;
    }
    if (confirm('هل تريد حذف هذا الموظف؟')) {
      onDelete(id);
      toast.success('تم حذف الموظف');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Add Form */}
      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            إضافة موظف جديد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="اسم الموظف"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              type="password"
              placeholder="كلمة المرور"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <Select
              value={formData.role}
              onValueChange={(v) => setFormData({ ...formData, role: v as Staff['role'] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="الصلاحية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">مدير</SelectItem>
                <SelectItem value="subs">مشتركين</SelectItem>
                <SelectItem value="sales">مبيعات</SelectItem>
                <SelectItem value="routers">راوترات</SelectItem>
                <SelectItem value="subs_sales">مشتركين ومبيعات</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 ml-2" />
              إضافة موظف
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member, index) => {
          const RoleIcon = roleIcons[member.role] || UserCog;
          return (
            <Card 
              key={member.id} 
              className="shadow-lg border-border/50 hover:shadow-xl transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center",
                      roleColors[member.role]
                    )}>
                      <RoleIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{member.name}</h3>
                      <span className={cn(
                        "inline-block px-3 py-1 rounded-full text-xs font-medium mt-1",
                        roleColors[member.role]
                      )}>
                        {roleLabels[member.role]}
                      </span>
                    </div>
                  </div>
                  
                  {member.role !== 'admin' && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-destructive" 
                      onClick={() => handleDelete(member.id, member.role)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {staff.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          لا يوجد موظفين
        </div>
      )}
    </div>
  );
};
