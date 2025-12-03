import 'dotenv/config';
import { supabase } from '../../../supabaseClient.js';

export async function GET() {
  return Response.json({
    url: process.env.SUPABASE_URL,
    anon: process.env.SUPABASE_ANON_KEY ? "loaded" : "missing"
  });
}
