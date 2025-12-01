import { createClient } from "@supabase/supabase-js";

// Your backend should use SERVER environment variables, not NEXT_PUBLIC
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || null;

// The server client (full access, used for saving build plans)
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Optional anon client (not needed, but included for future flexibility)
export const supabasePublic = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
