-- Create the athletes table
CREATE TABLE athletes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    club TEXT,
    class TEXT NOT NULL,
    discipline TEXT NOT NULL CHECK (discipline IN ('jump', 'trick', 'slalom')),
    result_1 JSONB DEFAULT '{}'::jsonb,
    result_2 JSONB DEFAULT '{}'::jsonb,
    best_score_value NUMERIC DEFAULT 0 -- A normalized score for sorting across the same discipline
);

-- Enable RLS (Optional but recommended)
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

-- Create policy for public read
CREATE POLICY "Public read access" ON athletes FOR SELECT USING (true);

-- Create policy for admin insert/update (Note: For a simple app, you might just use the Service Role or a simple policy)
-- For now, keep it simple and allow all for demo purposes if not using real auth, 
-- or restrict to admin user if you set up real Supabase Auth.
CREATE POLICY "Admin update access" ON athletes FOR ALL USING (true);
