-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('hr_admin', 'user');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy for user_roles: users can see their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Only hr_admins can manage roles
CREATE POLICY "HR admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'hr_admin'));

-- Drop existing permissive policies on candidates table
DROP POLICY IF EXISTS "Allow public read access to candidates" ON public.candidates;
DROP POLICY IF EXISTS "Allow public insert to candidates" ON public.candidates;
DROP POLICY IF EXISTS "Allow public update to candidates" ON public.candidates;

-- New RLS policies for candidates table:
-- 1. Public can insert (candidate submissions from form)
CREATE POLICY "Public can submit applications"
ON public.candidates FOR INSERT
WITH CHECK (true);

-- 2. Only authenticated users can read candidates
CREATE POLICY "Authenticated users can read candidates"
ON public.candidates FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3. Only HR admins can update candidates
CREATE POLICY "HR admins can update candidates"
ON public.candidates FOR UPDATE
USING (public.has_role(auth.uid(), 'hr_admin'));

-- 4. Only HR admins can delete candidates
CREATE POLICY "HR admins can delete candidates"
ON public.candidates FOR DELETE
USING (public.has_role(auth.uid(), 'hr_admin'));