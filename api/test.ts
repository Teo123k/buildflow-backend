import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const payload = {
    ok: true,
    message: "BuildFlow backend is alive 🧠",
    timestamp: new Date().toISOString()
  };

  res.status(200).json(payload);
}

