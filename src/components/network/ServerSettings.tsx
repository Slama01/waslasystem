import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Server, Wifi, WifiOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { isLocalServerMode, setLocalServerMode, testServerConnection } from '@/lib/api';
import { toast } from 'sonner';

export function ServerSettings() {
  const [useServer, setUseServer] = useState(false);
  const [serverUrl, setServerUrl] = useState('http://localhost:3001');
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');

  useEffect(() => {
    setUseServer(isLocalServerMode());
    const savedUrl = localStorage.getItem('localServerUrl');
    if (savedUrl) {
      setServerUrl(savedUrl);
    }
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionStatus('unknown');
    
    try {
      const isConnected = await testServerConnection(serverUrl);
      setConnectionStatus(isConnected ? 'connected' : 'failed');
      
      if (isConnected) {
        toast.success('تم الاتصال بالخادم بنجاح');
      } else {
        toast.error('فشل الاتصال بالخادم');
      }
    } catch {
      setConnectionStatus('failed');
      toast.error('فشل الاتصال بالخادم');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setLocalServerMode(useServer, serverUrl);
    toast.success('تم حفظ الإعدادات. يرجى تحديث الصفحة.');
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Server className="h-5 w-5" />
          إعدادات الخادم
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">استخدام خادم محلي</Label>
            <p className="text-xs text-muted-foreground">
              فعّل هذا الخيار للاتصال بخادم محلي على جهازك
            </p>
          </div>
          <Switch
            checked={useServer}
            onCheckedChange={setUseServer}
          />
        </div>

        {useServer && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="serverUrl">عنوان الخادم</Label>
              <Input
                id="serverUrl"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://192.168.1.100:3001"
                dir="ltr"
                className="text-left"
              />
              <p className="text-xs text-muted-foreground">
                أدخل عنوان IP الخادم مع المنفذ (عادة 3001)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : connectionStatus === 'connected' ? (
                  <Wifi className="h-4 w-4 ml-2 text-green-500" />
                ) : connectionStatus === 'failed' ? (
                  <WifiOff className="h-4 w-4 ml-2 text-red-500" />
                ) : (
                  <Wifi className="h-4 w-4 ml-2" />
                )}
                اختبار الاتصال
              </Button>
              
              {connectionStatus === 'connected' && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  متصل
                </span>
              )}
              {connectionStatus === 'failed' && (
                <span className="flex items-center gap-1 text-sm text-red-600">
                  <XCircle className="h-4 w-4" />
                  فشل الاتصال
                </span>
              )}
            </div>
          </div>
        )}

        <Button onClick={handleSave} className="w-full">
          حفظ الإعدادات
        </Button>

        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-lg">
          <p className="font-medium">ملاحظات:</p>
          <ul className="list-disc list-inside space-y-1 mr-2">
            <li>عند استخدام الخادم المحلي، ستُحفظ البيانات في قاعدة بيانات SQLite</li>
            <li>تأكد من تشغيل الخادم قبل تفعيل هذا الخيار</li>
            <li>للوصول من الجوال، استخدم عنوان IP الشبكة وليس localhost</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
