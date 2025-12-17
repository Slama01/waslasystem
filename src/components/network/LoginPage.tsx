import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wifi, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

interface LoginPageProps {
  onLogin: (username: string, password: string) => boolean;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      if (onLogin(username, password)) {
        toast.success('تم تسجيل الدخول بنجاح');
      } else {
        toast.error('اسم المستخدم أو كلمة المرور غير صحيحة');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <Card className="w-full max-w-md relative animate-scale-in shadow-2xl border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 gradient-primary rounded-2xl flex items-center justify-center shadow-lg animate-pulse-glow">
            <Wifi className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-l from-primary to-accent bg-clip-text text-transparent">
            شبكة بلس
          </CardTitle>
          <p className="text-muted-foreground">النسخة الاحترافية لإدارة الشبكات</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pr-10 h-12 text-base"
                required
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 h-12 text-base"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-semibold gradient-primary hover:opacity-90 transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </Button>
          </form>
          
          <p className="text-center text-sm text-muted-foreground mt-6">
            البيانات الافتراضية: admin / 123456
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
