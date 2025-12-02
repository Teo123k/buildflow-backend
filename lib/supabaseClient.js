import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error("[SUPABASE] Missing environment variables.");
}

export const supabase = createClient(url, anon);
