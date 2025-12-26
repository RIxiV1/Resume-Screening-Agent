-- Fix: Restrict candidate data access to HR admins only
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can read candidates" ON public.candidates;

-- Create new policy that restricts to HR admins only
CREATE POLICY "HR admins can read candidates"
ON public.candidates
FOR SELECT
USING (public.has_role(auth.uid(), 'hr_admin'));