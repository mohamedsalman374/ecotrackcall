-- ==============================================================================
-- ECOTRACK: COMPLETE UNIFIED SUPABASE DATABASE SCHEMA
-- ==============================================================================
-- Project Title:
--   "AI-Based Carbon Footprint Calculator and Eco Recommendation System"
--
-- Description:
--   Complete production-ready PostgreSQL database schema for Supabase:
--   1. public.profiles (Linked to auth.users, with role, preferences, is_active)
--   2. Backward-compatible public.users view
--   3. public.carbon_calculations (All footprint categories, JSON inputs, eco-score)
--   4. public.ai_recommendations (Personalized Groq/Llama recommendations, goals)
--   5. public.feedback (User feedback, ratings, screenshot URLs, admin response)
--   6. Full Row Level Security (RLS) policies for all tables
--   7. Supabase Storage buckets & policies for avatars and screenshots
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES TABLE (Linked to auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    profile_image_url TEXT,
    theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    language TEXT NOT NULL DEFAULT 'en',
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    weekly_reminder BOOLEAN NOT NULL DEFAULT TRUE,
    monthly_reminder BOOLEAN NOT NULL DEFAULT TRUE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ensure columns exist if upgrading from older schema
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Automatic 'updated_at' Timestamp Handler
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profiles_updated_at ON public.profiles;
CREATE TRIGGER on_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Automatic Profile Creation on Supabase Auth Signup Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        role,
        is_active,
        theme,
        language,
        email_notifications,
        weekly_reminder,
        monthly_reminder,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        'user',
        TRUE,
        'light',
        'en',
        TRUE,
        TRUE,
        TRUE,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security (RLS) on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
DROP POLICY IF EXISTS "Authenticated users can select own profile" ON public.profiles;
CREATE POLICY "Authenticated users can select own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;
CREATE POLICY "Authenticated users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
);

DROP POLICY IF EXISTS "Service role has full access" ON public.profiles;
CREATE POLICY "Service role has full access"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Guard against regular users escalating role
CREATE OR REPLACE FUNCTION public.prevent_role_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.role IS DISTINCT FROM NEW.role) 
       AND (current_setting('request.jwt.claim.role', true) = 'authenticated') THEN
        RAISE EXCEPTION 'Unauthorized: Users are not permitted to change their own role.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_role_modification ON public.profiles;
CREATE TRIGGER check_role_modification
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_modification();


-- ==============================================================================
-- 2. BACKWARD-COMPATIBLE public.users VIEW
-- ==============================================================================
CREATE OR REPLACE VIEW public.users AS
SELECT 
    p.id,
    p.full_name,
    p.profile_image_url,
    p.theme,
    p.language,
    p.email_notifications,
    p.weekly_reminder,
    p.monthly_reminder,
    p.role,
    p.is_active,
    p.last_login,
    p.created_at,
    p.updated_at,
    u.email
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id;


-- ==============================================================================
-- 3. CARBON CALCULATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.carbon_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    transportation_emissions NUMERIC NOT NULL DEFAULT 0,
    electricity_emissions NUMERIC NOT NULL DEFAULT 0,
    water_emissions NUMERIC NOT NULL DEFAULT 0,
    food_emissions NUMERIC NOT NULL DEFAULT 0,
    waste_emissions NUMERIC NOT NULL DEFAULT 0,
    shopping_emissions NUMERIC NOT NULL DEFAULT 0,
    travel_emissions NUMERIC NOT NULL DEFAULT 0,
    total_emissions NUMERIC NOT NULL DEFAULT 0,
    eco_score NUMERIC NOT NULL DEFAULT 0,
    input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_carbon_calculations_user_id ON public.carbon_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_carbon_calculations_created_at ON public.carbon_calculations(created_at);

-- RLS for carbon_calculations
ALTER TABLE public.carbon_calculations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own calculations" ON public.carbon_calculations;
CREATE POLICY "Users can view own calculations"
ON public.carbon_calculations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own calculations" ON public.carbon_calculations;
CREATE POLICY "Users can insert own calculations"
ON public.carbon_calculations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own calculations" ON public.carbon_calculations;
CREATE POLICY "Users can delete own calculations"
ON public.carbon_calculations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on carbon_calculations" ON public.carbon_calculations;
CREATE POLICY "Service role full access on carbon_calculations"
ON public.carbon_calculations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ==============================================================================
-- 4. AI RECOMMENDATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    calculation_id UUID REFERENCES public.carbon_calculations(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    response JSONB NOT NULL DEFAULT '{}'::jsonb,
    estimated_reduction NUMERIC NOT NULL DEFAULT 0,
    monthly_goal TEXT NOT NULL DEFAULT '',
    green_challenge TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON public.ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_calc_id ON public.ai_recommendations(calculation_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_created_at ON public.ai_recommendations(created_at);

-- RLS for ai_recommendations
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recommendations" ON public.ai_recommendations;
CREATE POLICY "Users can view own recommendations"
ON public.ai_recommendations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own recommendations" ON public.ai_recommendations;
CREATE POLICY "Users can insert own recommendations"
ON public.ai_recommendations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own recommendations" ON public.ai_recommendations;
CREATE POLICY "Users can delete own recommendations"
ON public.ai_recommendations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on ai_recommendations" ON public.ai_recommendations;
CREATE POLICY "Service role full access on ai_recommendations"
ON public.ai_recommendations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ==============================================================================
-- 5. FEEDBACK TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    screenshot_url TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Review', 'Resolved', 'Closed')),
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at);

-- Trigger for updated_at on feedback
DROP TRIGGER IF EXISTS on_feedback_updated_at ON public.feedback;
CREATE TRIGGER on_feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- RLS for feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;
CREATE POLICY "Users can view own feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own feedback" ON public.feedback;
CREATE POLICY "Users can insert own feedback"
ON public.feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending feedback" ON public.feedback;
CREATE POLICY "Users can update own pending feedback"
ON public.feedback
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'Pending');

DROP POLICY IF EXISTS "Users can delete own pending feedback" ON public.feedback;
CREATE POLICY "Users can delete own pending feedback"
ON public.feedback
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND status = 'Pending');

DROP POLICY IF EXISTS "Service role full access on feedback" ON public.feedback;
CREATE POLICY "Service role full access on feedback"
ON public.feedback
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);


-- ==============================================================================
-- 6. STORAGE BUCKETS (Avatars & Feedback Screenshots)
-- ==============================================================================
-- Run these statements in Supabase SQL Editor to configure storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('feedback-images', 'feedback-images', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public access to profile images" ON storage.objects;
CREATE POLICY "Public access to profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Authenticated users can update profile images" ON storage.objects;
CREATE POLICY "Authenticated users can update profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Authenticated users can delete profile images" ON storage.objects;
CREATE POLICY "Authenticated users can delete profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Public access to feedback images" ON storage.objects;
CREATE POLICY "Public access to feedback images"
ON storage.objects FOR SELECT
USING (bucket_id = 'feedback-images');

DROP POLICY IF EXISTS "Authenticated users can upload feedback images" ON storage.objects;
CREATE POLICY "Authenticated users can upload feedback images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'feedback-images');
