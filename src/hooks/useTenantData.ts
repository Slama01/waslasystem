import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Subscriber {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  router_id: string | null;
  package_name: string | null;
  package_price: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  daysLeft?: number;
}

export interface Router {
  id: string;
  name: string;
  ip_address: string | null;
  location: string | null;
  status: string;
  total_ports: number;
  used_ports: number;
  notes: string | null;
}

export interface Sale {
  id: string;
  subscriber_id: string | null;
  amount: number;
  type: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  subscriber_id: string;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  notes: string | null;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: any;
  created_at: string;
  user_id: string | null;
}

export interface DashboardStats {
  totalSubscribers: number;
  activeSubscribers: number;
  expiringSubscribers: number;
  expiredSubscribers: number;
  totalRouters: number;
  onlineRouters: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

const getDaysLeft = (endDate: string | null): number => {
  if (!endDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expire = new Date(endDate);
  expire.setHours(0, 0, 0, 0);
  return Math.ceil((expire.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export function useTenantData() {
  const { user, profile, tenant, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [routers, setRouters] = useState<Router[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user || !profile?.tenant_id) {
      setIsLoading(false);
      return;
    }

    try {
      const [subsRes, routersRes, salesRes, paymentsRes, activityRes] = await Promise.all([
        supabase.from('subscribers').select('*').order('created_at', { ascending: false }),
        supabase.from('routers').select('*').order('created_at', { ascending: false }),
        supabase.from('sales').select('*').order('created_at', { ascending: false }),
        supabase.from('payments').select('*').order('created_at', { ascending: false }),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(100),
      ]);

      if (subsRes.data) {
        setSubscribers(subsRes.data.map(s => ({
          ...s,
          package_price: Number(s.package_price) || 0,
          daysLeft: getDaysLeft(s.end_date),
        })));
      }
      if (routersRes.data) setRouters(routersRes.data);
      if (salesRes.data) setSales(salesRes.data.map(s => ({ ...s, amount: Number(s.amount) })));
      if (paymentsRes.data) setPayments(paymentsRes.data.map(p => ({ ...p, amount: Number(p.amount) })));
      if (activityRes.data) setActivityLog(activityRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل البيانات',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, profile?.tenant_id, toast]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);

  // Log activity helper
  const logActivity = async (action: string, entityType: string, entityId?: string, details?: any) => {
    if (!profile?.tenant_id) return;
    
    try {
      await supabase.from('activity_log').insert({
        tenant_id: profile.tenant_id,
        user_id: user?.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  // Subscriber operations
  const addSubscriber = async (data: Partial<Subscriber>) => {
    if (!profile?.tenant_id) return;

    const { data: newSub, error } = await supabase
      .from('subscribers')
      .insert({
        tenant_id: profile.tenant_id,
        name: data.name!,
        phone: data.phone,
        address: data.address,
        package_name: data.package_name,
        package_price: data.package_price || 0,
        status: 'active',
        start_date: data.start_date,
        end_date: data.end_date,
        notes: data.notes,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في إضافة المشترك', variant: 'destructive' });
      throw error;
    }

    await logActivity('add', 'subscriber', newSub.id, { name: data.name });
    await loadData();
    toast({ title: 'تم', description: 'تم إضافة المشترك بنجاح' });
    return newSub;
  };

  const updateSubscriber = async (id: string, data: Partial<Subscriber>) => {
    const { error } = await supabase
      .from('subscribers')
      .update(data)
      .eq('id', id);

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في تعديل المشترك', variant: 'destructive' });
      throw error;
    }

    await logActivity('edit', 'subscriber', id, data);
    await loadData();
    toast({ title: 'تم', description: 'تم تعديل المشترك بنجاح' });
  };

  const deleteSubscriber = async (id: string) => {
    const sub = subscribers.find(s => s.id === id);
    
    const { error } = await supabase
      .from('subscribers')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في حذف المشترك', variant: 'destructive' });
      throw error;
    }

    await logActivity('delete', 'subscriber', id, { name: sub?.name });
    await loadData();
    toast({ title: 'تم', description: 'تم حذف المشترك' });
  };

  // Router operations
  const addRouter = async (data: Partial<Router>) => {
    if (!profile?.tenant_id) return;

    const { data: newRouter, error } = await supabase
      .from('routers')
      .insert({
        tenant_id: profile.tenant_id,
        name: data.name!,
        ip_address: data.ip_address,
        location: data.location,
        status: data.status || 'active',
        total_ports: data.total_ports || 0,
        used_ports: data.used_ports || 0,
        notes: data.notes,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في إضافة الراوتر', variant: 'destructive' });
      throw error;
    }

    await logActivity('add', 'router', newRouter.id, { name: data.name });
    await loadData();
    toast({ title: 'تم', description: 'تم إضافة الراوتر بنجاح' });
    return newRouter;
  };

  const updateRouter = async (id: string, data: Partial<Router>) => {
    const { error } = await supabase
      .from('routers')
      .update(data)
      .eq('id', id);

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في تعديل الراوتر', variant: 'destructive' });
      throw error;
    }

    await logActivity('edit', 'router', id, data);
    await loadData();
    toast({ title: 'تم', description: 'تم تعديل الراوتر بنجاح' });
  };

  const deleteRouter = async (id: string) => {
    const router = routers.find(r => r.id === id);
    
    const { error } = await supabase
      .from('routers')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في حذف الراوتر', variant: 'destructive' });
      throw error;
    }

    await logActivity('delete', 'router', id, { name: router?.name });
    await loadData();
    toast({ title: 'تم', description: 'تم حذف الراوتر' });
  };

  // Sale operations
  const addSale = async (data: Partial<Sale>) => {
    if (!profile?.tenant_id) return;

    const { data: newSale, error } = await supabase
      .from('sales')
      .insert({
        tenant_id: profile.tenant_id,
        subscriber_id: data.subscriber_id,
        amount: data.amount!,
        type: data.type || 'subscription',
        payment_method: data.payment_method || 'cash',
        notes: data.notes,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في إضافة المبيعة', variant: 'destructive' });
      throw error;
    }

    await logActivity('add', 'sale', newSale.id, { amount: data.amount });
    await loadData();
    toast({ title: 'تم', description: 'تم إضافة المبيعة بنجاح' });
    return newSale;
  };

  // Payment operations
  const addPayment = async (data: Partial<Payment>) => {
    if (!profile?.tenant_id) return;

    const { data: newPayment, error } = await supabase
      .from('payments')
      .insert({
        tenant_id: profile.tenant_id,
        subscriber_id: data.subscriber_id!,
        amount: data.amount!,
        payment_date: data.payment_date || new Date().toISOString().split('T')[0],
        payment_method: data.payment_method || 'cash',
        notes: data.notes,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في إضافة الدفعة', variant: 'destructive' });
      throw error;
    }

    await logActivity('payment', 'payment', newPayment.id, { amount: data.amount });
    await loadData();
    toast({ title: 'تم', description: 'تم تسجيل الدفعة بنجاح' });
    return newPayment;
  };

  // Calculate stats
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  const stats: DashboardStats = {
    totalSubscribers: subscribers.length,
    activeSubscribers: subscribers.filter(s => s.status === 'active' && (s.daysLeft ?? 0) > 3).length,
    expiringSubscribers: subscribers.filter(s => s.status === 'active' && (s.daysLeft ?? 0) <= 3 && (s.daysLeft ?? 0) >= 0).length,
    expiredSubscribers: subscribers.filter(s => s.status === 'expired' || (s.daysLeft ?? 0) < 0).length,
    totalRouters: routers.length,
    onlineRouters: routers.filter(r => r.status === 'active').length,
    totalRevenue: payments.reduce((acc, p) => acc + p.amount, 0) + sales.reduce((acc, s) => acc + s.amount, 0),
    monthlyRevenue: payments
      .filter(p => p.payment_date.startsWith(currentMonth))
      .reduce((acc, p) => acc + p.amount, 0),
  };

  return {
    // Data
    subscribers,
    routers,
    sales,
    payments,
    activityLog,
    stats,
    tenant,
    profile,
    
    // Loading state
    isLoading: isLoading || authLoading,
    
    // Operations
    addSubscriber,
    updateSubscriber,
    deleteSubscriber,
    addRouter,
    updateRouter,
    deleteRouter,
    addSale,
    addPayment,
    
    // Refresh
    refreshData: loadData,
  };
}
