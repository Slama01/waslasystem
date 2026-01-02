-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'staff');

-- Create tenants table (companies/clients)
CREATE TABLE public.tenants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    phone TEXT,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    subscription_status TEXT NOT NULL DEFAULT 'trial',
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table (users linked to tenants)
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, tenant_id)
);

-- Create subscribers table
CREATE TABLE public.subscribers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    router_id UUID,
    package_name TEXT,
    package_price DECIMAL(10,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create routers table
CREATE TABLE public.routers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ip_address TEXT,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    total_ports INTEGER DEFAULT 0,
    used_ports INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key for subscribers.router_id
ALTER TABLE public.subscribers 
ADD CONSTRAINT subscribers_router_id_fkey 
FOREIGN KEY (router_id) REFERENCES public.routers(id) ON DELETE SET NULL;

-- Create sales table
CREATE TABLE public.sales (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL DEFAULT 'subscription',
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity_log table
CREATE TABLE public.activity_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Create function to get user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for tenants
CREATE POLICY "Users can view their own tenant" ON public.tenants
FOR SELECT USING (id = public.get_user_tenant_id());

CREATE POLICY "Owners can update their tenant" ON public.tenants
FOR UPDATE USING (id = public.get_user_tenant_id() AND public.has_role(auth.uid(), 'owner'));

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their tenant" ON public.profiles
FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their tenant" ON public.user_roles
FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Owners can manage roles" ON public.user_roles
FOR ALL USING (tenant_id = public.get_user_tenant_id() AND public.has_role(auth.uid(), 'owner'));

-- RLS Policies for subscribers
CREATE POLICY "Users can view subscribers in their tenant" ON public.subscribers
FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Staff can manage subscribers" ON public.subscribers
FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- RLS Policies for routers
CREATE POLICY "Users can view routers in their tenant" ON public.routers
FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Staff can manage routers" ON public.routers
FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- RLS Policies for sales
CREATE POLICY "Users can view sales in their tenant" ON public.sales
FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Staff can manage sales" ON public.sales
FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- RLS Policies for payments
CREATE POLICY "Users can view payments in their tenant" ON public.payments
FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Staff can manage payments" ON public.payments
FOR ALL USING (tenant_id = public.get_user_tenant_id());

-- RLS Policies for activity_log
CREATE POLICY "Users can view activity in their tenant" ON public.activity_log
FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Staff can insert activity" ON public.activity_log
FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id UUID;
  tenant_name TEXT;
  tenant_slug TEXT;
BEGIN
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
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscribers_updated_at BEFORE UPDATE ON public.subscribers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_routers_updated_at BEFORE UPDATE ON public.routers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();