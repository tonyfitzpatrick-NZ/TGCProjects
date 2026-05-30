import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nlqgqmsbyuxgvldlvstx.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Re-export everything from constants for backwards compatibility
export * from './constants'
