import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Save, Shield, Download, MessageCircle, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { ServerSettings } from './ServerSettings';

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

  const handleLocalBackup = () => {
    try {
      const backupData = {
        subscribers: JSON.parse(localStorage.getItem('subs') || '[]'),
        routers: JSON.parse(localStorage.getItem('routers') || '[]'),
        sales: JSON.parse(localStorage.getItem('sales') || '[]'),
        payments: JSON.parse(localStorage.getItem('payments') || '[]'),
        staff: JSON.parse(localStorage.getItem('staff') || '[]'),
        activityLog: JSON.parse(localStorage.getItem('activityLog') || '[]'),
        exportDate: new Date().toISOString(),
        version: '2.0'
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wasla-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('تم تحميل النسخة الاحتياطية بنجاح');
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('فشل في إنشاء النسخة الاحتياطية');
    }
  };

  const handleWhatsAppContact = () => {
    window.open('https://wa.me/970599489999', '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
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

      {/* Local Backup */}
      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            النسخ الاحتياطي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              قم بتحميل نسخة احتياطية من بياناتك على جهازك الشخصي. يمكنك استخدام هذه النسخة لاستعادة البيانات لاحقاً.
            </p>
            <Button onClick={handleLocalBackup} className="w-full gradient-primary hover:opacity-90">
              <Download className="w-4 h-4 ml-2" />
              تحميل نسخة احتياطية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact & Support */}
      <Card className="shadow-lg border-border/50 bg-gradient-to-br from-green-500/5 to-green-600/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            التواصل والدعم الفني
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              للحصول على نسخة من البرنامج أو الدعم الفني، تواصل معنا عبر الواتساب
            </p>
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
              <Phone className="w-5 h-5 text-green-500" />
              <span className="font-medium text-green-600 dark:text-green-400" dir="ltr">+970 599 489 999</span>
            </div>
            <Button 
              onClick={handleWhatsAppContact} 
              className="w-full bg-green-500 hover:bg-green-600 text-white"
            >
              <MessageCircle className="w-4 h-4 ml-2" />
              تواصل عبر واتساب
            </Button>
          </div>
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
            <p>وصــــــــــــــلة - نظام متكامل لإدارة شبكات الإنترنت والاشتراكات</p>
            <p className="text-sm">الإصدار 2.0</p>
          </div>
        </CardContent>
      </Card>

      {/* Server Settings */}
      <ServerSettings />
    </div>
  );
};