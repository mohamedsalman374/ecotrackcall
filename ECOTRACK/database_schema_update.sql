-- Module 5: Carbon Footprint Calculator Schema
-- Run this script in the Supabase SQL Editor

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.carbon_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    calculation_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Category Emissions (in kg CO2e)
    transportation_emissions NUMERIC NOT NULL DEFAULT 0,
    electricity_emissions NUMERIC NOT NULL DEFAULT 0,
    water_emissions NUMERIC NOT NULL DEFAULT 0,
    food_emissions NUMERIC NOT NULL DEFAULT 0,
    waste_emissions NUMERIC NOT NULL DEFAULT 0,
    shopping_emissions NUMERIC NOT NULL DEFAULT 0,
    travel_emissions NUMERIC NOT NULL DEFAULT 0,
    
    -- Totals and Scoring
    total_emissions NUMERIC NOT NULL DEFAULT 0,
    eco_score NUMERIC NOT NULL DEFAULT 0,
    
    -- Raw Input Data (for future analytics/ML features)
    input_data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.carbon_calculations ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Policy: Users can insert their own calculations
CREATE POLICY "Users can insert their own calculations" 
ON public.carbon_calculations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own calculations
CREATE POLICY "Users can view their own calculations" 
ON public.carbon_calculations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can delete their own calculations
CREATE POLICY "Users can delete their own calculations" 
ON public.carbon_calculations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policy: Users can update their own calculations (optional)
CREATE POLICY "Users can update their own calculations" 
ON public.carbon_calculations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. Create an index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_carbon_calculations_user_id ON public.carbon_calculations(user_id);
