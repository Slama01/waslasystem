import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  subscription_status: string;
  subscription_ends_at: string | null;
  created_at: string;
}

interface TenantWithOwner extends Tenant {
  owner_name: string | null;
  owner_email: string | null;
  subscribers_count: number;
}

export function useSuperAdmin() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [tenants, setTenants] = useState<TenantWithOwner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSuperAdmin();
  }, []);

  const checkSuperAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSuperAdmin(false);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking super admin:', error);
        setIsSuperAdmin(false);
      } else {
        setIsSuperAdmin(!!data);
        if (data) {
          await loadTenants();
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setIsSuperAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      // Fetch all tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (tenantsError) {
        console.error('Error loading tenants:', tenantsError);
        return;
      }

      // For each tenant, get owner info and subscribers count
      const tenantsWithOwners: TenantWithOwner[] = await Promise.all(
        (tenantsData || []).map(async (tenant) => {
          // Get owner profile
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('tenant_id', tenant.id)
            .limit(1)
            .maybeSingle();

          // Get subscribers count
          const { count } = await supabase
            .from('subscribers')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id);

          return {
            ...tenant,
            owner_name: ownerData?.full_name || null,
            owner_email: ownerData?.email || null,
            subscribers_count: count || 0,
          };
        })
      );

      setTenants(tenantsWithOwners);
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const toggleTenantStatus = async (tenantId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ is_active: isActive })
        .eq('id', tenantId);

      if (error) throw error;

      toast.success(isActive ? 'تم تفعيل الحساب بنجاح' : 'تم تعطيل الحساب بنجاح');
      await loadTenants();
    } catch (error) {
      console.error('Error toggling tenant status:', error);
      toast.error('حدث خطأ أثناء تحديث حالة الحساب');
    }
  };

  const updateSubscription = async (
    tenantId: string, 
    status: string, 
    endDate: string | null
  ) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ 
          subscription_status: status,
          subscription_ends_at: endDate 
        })
        .eq('id', tenantId);

      if (error) throw error;

      toast.success('تم تحديث الاشتراك بنجاح');
      await loadTenants();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('حدث خطأ أثناء تحديث الاشتراك');
    }
  };

  const extendTrial = async (tenantId: string, days: number) => {
    try {
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + days);

      const { error } = await supabase
        .from('tenants')
        .update({ 
          subscription_status: 'trial',
          subscription_ends_at: newEndDate.toISOString()
        })
        .eq('id', tenantId);

      if (error) throw error;

      toast.success(`تم تمديد الفترة التجريبية ${days} يوم`);
      await loadTenants();
    } catch (error) {
      console.error('Error extending trial:', error);
      toast.error('حدث خطأ أثناء تمديد الفترة التجريبية');
    }
  };

  const activateSubscription = async (tenantId: string, months: number) => {
    try {
      const newEndDate = new Date();
      newEndDate.setMonth(newEndDate.getMonth() + months);

      const { error } = await supabase
        .from('tenants')
        .update({ 
          subscription_status: 'active',
          subscription_ends_at: newEndDate.toISOString(),
          is_active: true
        })
        .eq('id', tenantId);

      if (error) throw error;

      toast.success(`تم تفعيل الاشتراك لمدة ${months} شهر`);
      await loadTenants();
    } catch (error) {
      console.error('Error activating subscription:', error);
      toast.error('حدث خطأ أثناء تفعيل الاشتراك');
    }
  };

  return {
    isSuperAdmin,
    tenants,
    isLoading,
    toggleTenantStatus,
    updateSubscription,
    extendTrial,
    activateSubscription,
    refreshTenants: loadTenants,
  };
}
