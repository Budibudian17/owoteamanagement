import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env['VITE_SUPABASE_URL']
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
}

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    storage: isBrowser ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'Accept': 'application/json',
    },
  },
})
