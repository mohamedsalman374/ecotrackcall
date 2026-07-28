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


CREATE TABLE IF NOT EXISTS carbon_calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transportation_emissions NUMERIC NOT NULL,
    electricity_emissions NUMERIC NOT NULL,
    water_emissions NUMERIC NOT NULL,
    food_emissions NUMERIC NOT NULL,
    waste_emissions NUMERIC NOT NULL,
    shopping_emissions NUMERIC NOT NULL,
    travel_emissions NUMERIC NOT NULL,
    total_emissions NUMERIC NOT NULL,
    eco_score NUMERIC NOT NULL,
    input_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE carbon_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own calculations"
ON carbon_calculations FOR INSERT
WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can view their own calculations"
ON carbon_calculations FOR SELECT
USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));



CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    calculation_id UUID REFERENCES carbon_calculations(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    response JSONB NOT NULL,
    estimated_reduction NUMERIC NOT NULL,
    monthly_goal TEXT NOT NULL,
    green_challenge TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own recommendations"
ON ai_recommendations FOR INSERT
WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can view their own recommendations"
ON ai_recommendations FOR SELECT
USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

