-- Add RLS policies for super admins to manage subscribers across all tenants

-- Super admins can view all subscribers
CREATE POLICY "Super admins can view all subscribers"
ON public.subscribers
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Super admins can update all subscribers
CREATE POLICY "Super admins can update all subscribers"
ON public.subscribers
FOR UPDATE
USING (is_super_admin(auth.uid()));

-- Super admins can delete all subscribers
CREATE POLICY "Super admins can delete all subscribers"
ON public.subscribers
FOR DELETE
USING (is_super_admin(auth.uid()));

-- Super admins can view all profiles (for tenant owner info)
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_super_admin(auth.uid()));