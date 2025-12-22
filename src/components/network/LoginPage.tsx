import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wifi, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
interface LoginPageProps {
  onLogin: (username: string, password: string) => boolean | Promise<boolean>;
}
export const LoginPage = ({
  onLogin
}: LoginPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await onLogin(username, password);
      if (result) {
        toast.success('تم تسجيل الدخول بنجاح');
      } else {
        toast.error('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 sm:top-20 right-10 sm:right-20 w-48 sm:w-72 h-48 sm:h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 sm:bottom-20 left-10 sm:left-20 w-64 sm:w-96 h-64 sm:h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '1s'
      }} />
      </div>
      
      <Card className="w-full max-w-md relative animate-scale-in shadow-2xl border-primary/20">
        <CardHeader className="text-center space-y-3 sm:space-y-4 px-4 sm:px-6">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 gradient-primary rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg animate-pulse-glow">
            <Wifi className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
            وصلة
          </CardTitle>
          <p className="text-sm sm:text-base text-muted-foreground">نظام إدارة شبكات الإنترنت</p>
        </CardHeader>
        
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input type="text" placeholder="اسم المستخدم" value={username} onChange={e => setUsername(e.target.value)} className="pr-10 h-11 sm:h-12 text-base" required />
            </div>
            
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input type="password" placeholder="كلمة المرور" value={password} onChange={e => setPassword(e.target.value)} className="pr-10 h-11 sm:h-12 text-base" required />
            </div>
            
            <Button type="submit" className="w-full h-11 sm:h-12 text-base sm:text-lg font-semibold gradient-primary hover:opacity-90 transition-all" disabled={isLoading}>
              {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </Button>
          </form>
          
          
        </CardContent>
      </Card>
    </div>;
};