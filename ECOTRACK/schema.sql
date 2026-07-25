CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    profile_image_url TEXT,
    eco_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON users FOR SELECT 
USING (auth.uid() = auth_user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON users FOR UPDATE 
USING (auth.uid() = auth_user_id);

-- Create a function to automatically sync newly created users from auth.users to public.users?
-- Not strictly required if handled perfectly in backend, but good for completeness. We will manage this from the Flask backend.
