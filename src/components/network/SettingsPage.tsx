import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Save, Shield } from 'lucide-react';
import { toast } from 'sonner';
interface SettingsPageProps {
  onChangePassword: (newPassword: string) => void;
}
export const SettingsPage = ({
  onChangePassword
}: SettingsPageProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error('الرجاء إدخال كلمة المرور الجديدة');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور غير متطابقة');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    onChangePassword(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    toast.success('تم تغيير كلمة المرور بنجاح');
  };
  return <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Password Change */}
      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            تغيير كلمة المرور
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">كلمة المرور الجديدة</label>
              <Input type="password" placeholder="أدخل كلمة المرور الجديدة" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">تأكيد كلمة المرور</label>
              <Input type="password" placeholder="أعد إدخال كلمة المرور" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            <Button type="submit" className="gradient-primary hover:opacity-90">
              <Save className="w-4 h-4 ml-2" />
              حفظ التغييرات
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            عن البرنامج
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-muted-foreground">
            <p className="bg-primary-foreground"><strong>شبكة بلس</strong>​وصلة</p>
            <p>نظام متكامل لإدارة شبكات الإنترنت والاشتراكات</p>
            <p className="text-sm">الإصدار 2.0</p>
          </div>
        </CardContent>
      </Card>
    </div>;
};