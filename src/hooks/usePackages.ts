import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Package {
  id: string;
  name: string;
  speed: number;
  price: number;
  duration_days: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export function usePackages() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPackages = useCallback(async () => {
    if (!profile?.tenant_id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('speed', { ascending: true });

      if (error) throw error;
      
      setPackages(data?.map(p => ({
        ...p,
        price: Number(p.price) || 0,
      })) || []);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.tenant_id]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const addPackage = async (data: Omit<Package, 'id' | 'created_at' | 'is_active'>) => {
    if (!profile?.tenant_id) return;

    const { error } = await supabase
      .from('packages')
      .insert({
        tenant_id: profile.tenant_id,
        name: data.name,
        speed: data.speed,
        price: data.price,
        duration_days: data.duration_days,
        description: data.description,
      });

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في إضافة الباقة', variant: 'destructive' });
      throw error;
    }

    await loadPackages();
    toast({ title: 'تم', description: 'تم إضافة الباقة بنجاح' });
  };

  const updatePackage = async (id: string, data: Partial<Package>) => {
    const { error } = await supabase
      .from('packages')
      .update(data)
      .eq('id', id);

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في تعديل الباقة', variant: 'destructive' });
      throw error;
    }

    await loadPackages();
    toast({ title: 'تم', description: 'تم تعديل الباقة بنجاح' });
  };

  const deletePackage = async (id: string) => {
    const { error } = await supabase
      .from('packages')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في حذف الباقة', variant: 'destructive' });
      throw error;
    }

    await loadPackages();
    toast({ title: 'تم', description: 'تم حذف الباقة' });
  };

  return {
    packages,
    isLoading,
    addPackage,
    updatePackage,
    deletePackage,
    refreshPackages: loadPackages,
  };
}
