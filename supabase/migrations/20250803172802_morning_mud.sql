/*
  # Create providers table and assessments table

  1. New Tables
    - `providers`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `created_at` (timestamp)
    - `assessments`
      - `id` (uuid, primary key)
      - `risk_score` (integer)
      - `risk_category` (text)
      - `inputs` (jsonb)
      - `recommendations` (jsonb)
      - `status` (text, default 'pending')
      - `overall_recommendation` (text)
      - `provider_comments` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated providers
*/

CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_score integer NOT NULL,
  risk_category text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}',
  recommendations jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  overall_recommendation text,
  provider_comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can read own data"
  ON providers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can update own data"
  ON providers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated providers can read all assessments"
  ON assessments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated providers can update assessments"
  ON assessments
  FOR UPDATE
  TO authenticated
  USING (true);

-- Insert sample assessments for testing
INSERT INTO assessments (risk_score, risk_category, inputs, recommendations) VALUES
(75, 'High Risk', 
 '{"age": 65, "systolic_bp": 150, "cholesterol": 240, "smoking": true, "family_history": true}',
 '{"lifestyle": ["Smoking cessation program", "Regular exercise"], "medication": ["ACE inhibitor", "Statin therapy"], "monitoring": ["Monthly BP checks", "Quarterly lipid panels"]}'),
(45, 'Moderate Risk',
 '{"age": 50, "systolic_bp": 130, "cholesterol": 200, "smoking": false, "family_history": false}',
 '{"lifestyle": ["Mediterranean diet", "30min daily exercise"], "medication": ["Low-dose aspirin"], "monitoring": ["Annual checkup"]}'),
(25, 'Low Risk',
 '{"age": 35, "systolic_bp": 115, "cholesterol": 180, "smoking": false, "family_history": false}',
 '{"lifestyle": ["Maintain current diet", "Continue regular exercise"], "monitoring": ["Biannual screening"]}');