import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Wifi, 
  Loader2, 
  Eye, 
  EyeOff, 
  Users, 
  Shield, 
  BarChart3, 
  Clock, 
  Zap,
  CheckCircle2,
  ArrowLeft,
  Star
} from 'lucide-react';

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        let errorMessage = 'حدث خطأ في تسجيل الدخول';
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'يرجى تأكيد البريد الإلكتروني أولاً';
        }
        toast({
          title: 'خطأ في تسجيل الدخول',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: 'مرحباً بك في نظام وصلة',
      });
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupEmail || !signupPassword || !fullName || !companyName) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    if (signupPassword.length < 6) {
      toast({
        title: 'خطأ',
        description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        variant: 'destructive',
      });
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: 'خطأ',
        description: 'كلمات المرور غير متطابقة',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            company_name: companyName,
            company_slug: companyName.toLowerCase().replace(/\s+/g, '-'),
          },
        },
      });

      if (error) {
        let errorMessage = 'حدث خطأ في التسجيل';
        if (error.message.includes('already registered')) {
          errorMessage = 'هذا البريد الإلكتروني مسجل مسبقاً';
        }
        toast({
          title: 'خطأ في التسجيل',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'تم التسجيل بنجاح! 🎉',
        description: 'مرحباً بك في نظام وصلة - لديك 14 يوم تجربة مجانية',
      });
      navigate('/');
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Users,
      title: 'إدارة المشتركين',
      description: 'تتبع جميع مشتركيك وإدارة اشتراكاتهم بسهولة'
    },
    {
      icon: BarChart3,
      title: 'تقارير مفصلة',
      description: 'إحصائيات وتقارير شاملة عن أداء شبكتك'
    },
    {
      icon: Shield,
      title: 'أمان عالي',
      description: 'حماية متقدمة لبيانات شبكتك ومشتركيك'
    },
    {
      icon: Clock,
      title: 'تتبع الاشتراكات',
      description: 'تنبيهات تلقائية قبل انتهاء اشتراكات المشتركين'
    },
    {
      icon: Zap,
      title: 'سرعة وكفاءة',
      description: 'واجهة سريعة وسهلة الاستخدام لإدارة عملك'
    },
    {
      icon: Star,
      title: 'دعم فني متميز',
      description: 'فريق دعم جاهز لمساعدتك على مدار الساعة'
    }
  ];

  const stats = [
    { value: '+500', label: 'شبكة نشطة' },
    { value: '+10,000', label: 'مشترك' },
    { value: '99.9%', label: 'وقت التشغيل' },
  ];

  // Landing Page
  if (!showAuthForm) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <div className="absolute top-0 left-0 w-full h-full opacity-5">
            <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent rounded-full blur-3xl" />
          </div>

          {/* Header */}
          <header className="relative z-10 container mx-auto px-4 py-6">
            <nav className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg animate-pulse-glow">
                  <Wifi className="w-7 h-7 text-primary-foreground" />
                </div>
                <span className="text-2xl font-bold text-foreground">وصلة</span>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowAuthForm(true)}
                className="gap-2"
              >
                <span>تسجيل الدخول</span>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </nav>
          </header>

          {/* Hero Content */}
          <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
            <div className="text-center max-w-4xl mx-auto space-y-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                <Zap className="w-4 h-4" />
                <span>14 يوم تجربة مجانية</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight">
                أدِر شبكة الإنترنت خاصتك
                <span className="block text-transparent bg-clip-text bg-gradient-to-l from-primary to-accent">
                  باحترافية وسهولة
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                نظام وصلة هو الحل الأمثل لإدارة شبكات الإنترنت والمشتركين. 
                تتبع الاشتراكات، أدر المدفوعات، واحصل على تقارير مفصلة من مكان واحد.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => setShowAuthForm(true)}
                  className="text-lg px-8 py-6 bg-gradient-to-l from-primary to-accent hover:opacity-90 transition-opacity shadow-lg"
                >
                  ابدأ الآن مجاناً
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setShowAuthForm(true)}
                  className="text-lg px-8 py-6"
                >
                  تسجيل الدخول
                </Button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-8 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                    <div className="text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="py-20 bg-card/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                كل ما تحتاجه لإدارة شبكتك
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                مجموعة متكاملة من الأدوات المصممة خصيصاً لمزودي خدمات الإنترنت
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card"
                >
                  <CardContent className="p-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <feature.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-l from-primary to-accent">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              جاهز لإدارة شبكتك بشكل أفضل؟
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
              انضم إلى مئات الشبكات التي تثق بنظام وصلة لإدارة أعمالها
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => setShowAuthForm(true)}
              className="text-lg px-8 py-6"
            >
              ابدأ تجربتك المجانية
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  لماذا وصلة؟
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {[
                  'واجهة عربية سهلة الاستخدام',
                  'تقارير مفصلة ولحظية',
                  'إدارة متعددة المستخدمين',
                  'تنبيهات انتهاء الاشتراكات',
                  'دعم فني على مدار الساعة',
                  'تحديثات مستمرة ومجانية',
                  'نسخ احتياطي آمن للبيانات',
                  'تجربة مجانية بدون التزام',
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border/50">
                    <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
                    <span className="text-foreground font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* WhatsApp Contact */}
        <section className="py-12 bg-gradient-to-l from-green-500/10 to-green-600/10">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-xl mx-auto space-y-4">
              <h2 className="text-2xl font-bold text-foreground">تواصل معنا</h2>
              <p className="text-muted-foreground">
                للحصول على نسخة من البرنامج أو الدعم الفني
              </p>
              <Button 
                size="lg" 
                onClick={() => window.open('https://wa.me/970599489999', '_blank')}
                className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-6"
              >
                <span>تواصل عبر واتساب</span>
                <span className="mr-2" dir="ltr">+970 599 489 999</span>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 bg-card border-t border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">وصلة</span>
              </div>
              <p className="text-muted-foreground text-sm">
                © {new Date().getFullYear()} نظام وصلة - جميع الحقوق محفوظة
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Auth Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center space-y-4">
          <button 
            onClick={() => setShowAuthForm(false)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
            <Wifi className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">نظام وصلة</CardTitle>
            <CardDescription>نظام إدارة شبكات الإنترنت المتكامل</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">البريد الإلكتروني</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="example@company.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isLoading}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoading}
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    'تسجيل الدخول'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">الاسم الكامل *</Label>
                  <Input
                    id="full-name"
                    type="text"
                    placeholder="أحمد محمد"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-name">اسم الشركة/المشروع *</Label>
                  <Input
                    id="company-name"
                    type="text"
                    placeholder="شبكة الحي"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">البريد الإلكتروني *</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="example@company.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    disabled={isLoading}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">كلمة المرور *</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="6 أحرف على الأقل"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    disabled={isLoading}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">تأكيد كلمة المرور *</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="أعد إدخال كلمة المرور"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    dir="ltr"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري إنشاء الحساب...
                    </>
                  ) : (
                    'إنشاء حساب جديد'
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  بإنشاء حساب، ستحصل على 14 يوم تجربة مجانية
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
