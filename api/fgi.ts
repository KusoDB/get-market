import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const rapidKey = process.env.RAPIDAPI_KEY;
  if (!rapidKey) {
    return res
      .status(500)
      .json({ error: 'RAPIDAPI_KEY が未設定です。' });
  }

  try {
    const response = await fetch(
      'https://fear-and-greed-index.p.rapidapi.com/v1/fgi',
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidKey,
          'X-RapidAPI-Host': 'fear-and-greed-index.p.rapidapi.com',
        },
      }
    );

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (e: any) {
    console.error('FGI fetch error:', e);
    return res
      .status(500)
      .json({ error: e.message });
  }
}