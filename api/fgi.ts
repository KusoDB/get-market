import type { VercelRequest, VercelResponse } from '@vercel/node';

type FgiData = any;  // 実際のレスポンス型に置き換えてください
const TTL = 24 * 60 * 60 * 1000; // 24時間

// モジュールスコープのキャッシュ
let fgiCache: { timestamp: number; data: FgiData } | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const now = Date.now();

  // キャッシュが生きていればそれを返す
  if (fgiCache && now - fgiCache.timestamp < TTL) {
    return res.status(200).json(fgiCache.data);
  }

  // 無ければ新規取得
  const rapidKey = process.env.RAPIDAPI_KEY;
  if (!rapidKey) {
    return res.status(500).json({ error: 'RAPIDAPI_KEY が未設定です。' });
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

    // キャッシュ更新
    fgiCache = { timestamp: now, data };

    return res.status(response.status).json(data);
  } catch (e: any) {
    console.error('FGI fetch error:', e);
    return res.status(500).json({ error: e.message });
  }
}
