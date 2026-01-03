-- Add super_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Create super_admins table to track platform administrators
CREATE TABLE public.super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Super admins can view the table
CREATE POLICY "Super admins can view super_admins table"
ON public.super_admins
FOR SELECT
TO authenticated
USING (true);

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = _user_id
  )
$$;

-- Function to check if this is the first user
CREATE OR REPLACE FUNCTION public.is_first_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1)
$$;

-- Update handle_new_user to make first user a super admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  new_tenant_id UUID;
  tenant_name TEXT;
  tenant_slug TEXT;
  is_first BOOLEAN;
BEGIN
  -- Check if this is the first user
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO is_first;
  
  -- Get tenant info from metadata or create new
  tenant_name := COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'شركتي');
  tenant_slug := LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'company_slug', 'company-' || LEFT(NEW.id::TEXT, 8)), ' ', '-'));
  
  -- Create new tenant
  INSERT INTO public.tenants (name, slug, subscription_ends_at)
  VALUES (tenant_name, tenant_slug, NOW() + INTERVAL '14 days')
  RETURNING id INTO new_tenant_id;
  
  -- Create profile
  INSERT INTO public.profiles (id, tenant_id, full_name, email)
  VALUES (
    NEW.id,
    new_tenant_id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  
  -- Assign owner role
  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (NEW.id, new_tenant_id, 'owner');
  
  -- If first user, make them super admin
  IF is_first THEN
    INSERT INTO public.super_admins (user_id) VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Allow super admins to manage all tenants
CREATE POLICY "Super admins can view all tenants"
ON public.tenants
FOR SELECT
TO authenticated
USING (
  id = get_user_tenant_id() OR is_super_admin(auth.uid())
);

CREATE POLICY "Super admins can update all tenants"
ON public.tenants
FOR UPDATE
TO authenticated
USING (is_super_admin(auth.uid()));

-- Drop old SELECT policy on tenants (we're replacing it)
DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;