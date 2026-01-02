import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export const TrialExpiryAlert = () => {
  const { tenant } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when tenant changes
  useEffect(() => {
    setDismissed(false);
  }, [tenant?.id]);

  if (!tenant || dismissed) return null;

  const subscriptionEndsAt = tenant.subscription_ends_at;
  const subscriptionStatus = tenant.subscription_status;

  // Only show for trial accounts
  if (subscriptionStatus !== 'trial' || !subscriptionEndsAt) return null;

  const expiryDate = new Date(subscriptionEndsAt);
  const today = new Date();
  const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Don't show if more than 7 days left
  if (daysLeft > 7) return null;

  const isExpired = daysLeft <= 0;
  const isUrgent = daysLeft <= 3;

  return (
    <Alert 
      variant={isExpired ? "destructive" : "default"}
      className={`mb-4 ${isUrgent && !isExpired ? 'border-warning bg-warning/10' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {isExpired ? (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          ) : (
            <Clock className={`h-5 w-5 ${isUrgent ? 'text-warning' : 'text-primary'}`} />
          )}
          <div>
            <AlertTitle className="text-base font-semibold">
              {isExpired 
                ? '⚠️ انتهت الفترة التجريبية!' 
                : `⏰ الفترة التجريبية تنتهي قريباً`
              }
            </AlertTitle>
            <AlertDescription className="mt-1">
              {isExpired ? (
                'انتهت فترتك التجريبية. يرجى الاشتراك لمتابعة استخدام النظام.'
              ) : daysLeft === 1 ? (
                'باقي يوم واحد فقط على انتهاء الفترة التجريبية!'
              ) : (
                `باقي ${daysLeft} أيام على انتهاء الفترة التجريبية (${expiryDate.toLocaleDateString('ar-SA')})`
              )}
            </AlertDescription>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 shrink-0"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
};
