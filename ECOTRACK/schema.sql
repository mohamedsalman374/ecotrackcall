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



-- MODULE 9: USER PROFILE ADDITIONS
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system';
ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_reminder BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_reminder BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
\$\$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_modtime ON users;
CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Note: To fully support the storage requirements, run the following in Supabase SQL editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true) ON CONFLICT DO NOTHING;
-- CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');
-- CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-images');
-- CREATE POLICY "Anyone can update their own avatar." ON storage.objects FOR UPDATE USING (bucket_id = 'profile-images');
-- CREATE POLICY "Anyone can delete their own avatar." ON storage.objects FOR DELETE USING (bucket_id = 'profile-images');



-- MODULE 10: FEEDBACK SYSTEM
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    screenshot_url TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Review', 'Resolved', 'Closed')),
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own feedback"
ON feedback FOR INSERT
WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can view their own feedback"
ON feedback FOR SELECT
USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own pending feedback"
ON feedback FOR UPDATE
USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id) AND status = 'Pending');

CREATE POLICY "Users can delete their own pending feedback"
ON feedback FOR DELETE
USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id) AND status = 'Pending');

CREATE TRIGGER update_feedback_modtime
BEFORE UPDATE ON feedback
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Note: To fully support the storage requirements, run the following in Supabase SQL editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('feedback-images', 'feedback-images', true) ON CONFLICT DO NOTHING;
-- CREATE POLICY "Feedback images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'feedback-images');
-- CREATE POLICY "Anyone can upload a feedback image." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'feedback-images');
-- CREATE POLICY "Anyone can update their own feedback image." ON storage.objects FOR UPDATE USING (bucket_id = 'feedback-images');
-- CREATE POLICY "Anyone can delete their own feedback image." ON storage.objects FOR DELETE USING (bucket_id = 'feedback-images');

