-- Create candidates table to store screening results
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  verdict TEXT NOT NULL DEFAULT 'hold',
  confidence INTEGER,
  summary TEXT,
  matched_skills TEXT[],
  years_relevant_experience INTEGER,
  short_reason TEXT,
  recommended_next_steps TEXT[],
  email_draft TEXT,
  interview_email_sent BOOLEAN NOT NULL DEFAULT false,
  rejection_email_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (HR dashboard)
CREATE POLICY "Allow public read access to candidates" 
ON public.candidates 
FOR SELECT 
USING (true);

-- Create policy for public insert (form submissions)
CREATE POLICY "Allow public insert to candidates" 
ON public.candidates 
FOR INSERT 
WITH CHECK (true);

-- Create policy for public update (email sent status)
CREATE POLICY "Allow public update to candidates" 
ON public.candidates 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();