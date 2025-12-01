import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase/client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET supported' });
  }

  const { data, error } = await supabase
    .from('db_test')
    .select('id, message')
    .limit(1)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({
    ok: true,
    message: 'Supabase connection is working',
    row: data,
  });
}

