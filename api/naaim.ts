// api/naaim.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const response = await fetch('https://naaim.org/programs/naaim-exposure-index/');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    const $ = cheerio.load(html);
    const header = $('h4')
      .filter((_, el) => $(el).text().includes("This week"))
      .first();
    if (!header.length) throw new Error('見出し要素が見つかりません');

    const raw = header.next().text().trim();
   
    if (!raw) throw new Error('数値テキストが空です');

    const match = raw.match(/[\d]+\.[\d]+/);
    if (!match) throw new Error('テキスト中に数値が見つかりません');
    const value = parseFloat(match[0]);
    if (isNaN(value)) throw new Error('数値変換に失敗しました');

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json({ naaimExposureIndex: value });
  } catch (err: any) {
    console.error('NAAIM取得エラー:', err);
    res.status(500).json({ error: err.message });
  }
}
