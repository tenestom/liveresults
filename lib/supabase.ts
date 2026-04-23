import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// Clean URL: Remove trailing slash and /rest/v1 if the user mistakenly included it
if (supabaseUrl) {
  supabaseUrl = supabaseUrl.replace(/\/$/, "").replace(/\/rest\/v1$/, "");
}

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.error('Supabase credentials missing! Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
} else {
  if (typeof window !== 'undefined') {
     console.log('Supabase Initialized with URL:', supabaseUrl.substring(0, 15) + '...');
  }
}

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {} as any;
