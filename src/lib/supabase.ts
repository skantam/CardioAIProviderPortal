import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Provider = {
  id: string
  user_id: string
  email: string
  full_name: string
  license_number: string
  created_at: string
}

export type Assessment = {
  id: string
  user_id: string
  risk_score: number
  risk_category: string
  inputs: Record<string, any>
  recommendations: Record<string, string[]>
  status: string
  overall_recommendation?: string
  provider_comments?: string
  created_at: string
  updated_at: string
}