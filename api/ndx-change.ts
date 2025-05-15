import type { VercelRequest, VercelResponse } from '@vercel/node';
import yahooFinance from 'yahoo-finance2';
import { format, subDays } from 'date-fns';

const SYMBOL = '^NDX';

// 今日を含めた「直近の金曜日」を返す
function getLastFriday(date: Date): Date {
  const diff = (date.getDay() - 5 + 7) % 7;
  return subDays(date, diff);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const now = new Date();

    // 最近の金曜日
    const lastFriday = getLastFriday(now);
    const lastFridayStr = format(lastFriday, 'yyyy-MM-dd');

    // 先々週金曜
    const twoWeeksAgoFriday = subDays(lastFriday, 7);
    const twoWeeksAgoFridayStr = format(twoWeeksAgoFriday, 'yyyy-MM-dd');

    // データ取得
    const chartData = await yahooFinance.chart(SYMBOL, {
      period1: twoWeeksAgoFridayStr,
      period2: lastFridayStr,
      interval: '1d',
    });
    const quotes = chartData?.quotes ?? [];
    if (!quotes.length) {
      return res.status(404).json({ error: 'データ取得に失敗しました。' });
    }

    const twoWeeksAgoClose = quotes[0].close!;
    const lastFridayClose = quotes[quotes.length - 1].close!;
    const changePct = ((lastFridayClose - twoWeeksAgoClose) / twoWeeksAgoClose) * 100;

    // CDN に 24時間キャッシュさせるヘッダー
    res.setHeader(
      'Cache-Control',
      'public, max-age=0, s-maxage=86400, stale-while-revalidate=3600'
    );

    return res.status(200).json({
      lastFridayDate: lastFridayStr,
      lastFridayClose,
      twoWeeksAgoDate: twoWeeksAgoFridayStr,
      twoWeeksAgoClose,
      percentageChange: changePct.toFixed(2),
    });
  } catch (e: any) {
    console.error('NDX fetch error:', e);
    return res.status(500).json({ error: e.message });
  }
}
