-- ==============================================================================
-- ECOTRACK: SUPABASE AUTHENTICATION & PROFILES FOUNDATION SCHEMA
-- ==============================================================================
-- Project: AI-Based Carbon Footprint Calculator and Eco Recommendation System
-- Description:
--   1. Creates the public.profiles table linked to auth.users
--   2. Enforces PostgreSQL Row Level Security (RLS)
--   3. Sets up automatic updated_at timestamp triggers
--   4. Creates an automatic profile creation trigger on auth.users (Signup)
--   5. Implements security guards preventing regular users from self-escalating role
--   6. Provides a backward-compatible public.users view for future modules
-- ==============================================================================

-- 1. Create the 'profiles' Table linked to Supabase auth.users
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
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- 3. Automatic 'updated_at' Timestamp Handler
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

-- 4. Automatic Profile Creation on Supabase Auth Signup Trigger
-- Reads metadata passed during sign_up({options: {data: {full_name: '...'}}})
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        role,
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

-- 5. Enable Row Level Security (RLS) on public.profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Policy 1: Authenticated users can SELECT only their own profile
DROP POLICY IF EXISTS "Authenticated users can select own profile" ON public.profiles;
CREATE POLICY "Authenticated users can select own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Authenticated users can UPDATE only their own profile
-- Restricts modifications to their own ID and enforces that role cannot be changed
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

-- Policy 3: Service Role full access (used by server-side admin operations)
DROP POLICY IF EXISTS "Service role has full access" ON public.profiles;
CREATE POLICY "Service role has full access"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Extra Guard: Prevent Regular Users from Modifying Role
CREATE OR REPLACE FUNCTION public.prevent_role_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- If role is changed and caller is a regular authenticated user, raise exception
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

-- 8. Backward Compatibility View for public.users
-- Ensures future modules or legacy queries referencing 'users' continue to work seamlessly
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
    p.last_login,
    p.created_at,
    p.updated_at,
    u.email
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id;
