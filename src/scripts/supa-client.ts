import { createClient } from '@supabase/supabase-js';
// import { Database } from './database.types.ts';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_API_URL;
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
