import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  tenant_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
}

interface UserRole {
  role: 'owner' | 'admin' | 'staff' | 'super_admin';
  tenant_id: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  subscription_status: string;
  subscription_ends_at: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer profile fetching with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRole(null);
          setTenant(null);
          setIsSuperAdmin(false);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else if (profileData) {
        setProfile(profileData);

        // Fetch user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role, tenant_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (roleData) {
          setUserRole(roleData as UserRole);
        }

        // Check if super admin
        const { data: superAdminData } = await supabase
          .from('super_admins')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        
        setIsSuperAdmin(!!superAdminData);

        // Fetch tenant
        if (profileData.tenant_id) {
          const { data: tenantData } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profileData.tenant_id)
            .maybeSingle();

          if (tenantData) {
            setTenant(tenantData);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setUserRole(null);
    setTenant(null);
  };

  return {
    user,
    session,
    profile,
    userRole,
    tenant,
    isSuperAdmin,
    isLoading,
    signOut,
    isOwner: userRole?.role === 'owner',
    isAdmin: userRole?.role === 'admin' || userRole?.role === 'owner',
  };
}
