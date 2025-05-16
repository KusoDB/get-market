import type { VercelRequest, VercelResponse } from '@vercel/node';
import yahooFinance from 'yahoo-finance2';
import { format } from 'date-fns';
import { RSI } from 'technicalindicators';

type Stat = {
  symbol: string;
  dayBeforeDate: string;
  dayBeforeClose: number;
  yesterdayDate: string;
  yesterdayClose: number;
  percentageChange: string;
  rsi: string;
};

const SYMBOLS = ['^NDX', '^SOX', 'XLK', '^VIX'];
const TTL = 24 * 60 * 60 * 1000;
let statsCache: { timestamp: number; data: Stat[] } | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const now = Date.now();
  if (statsCache && now - statsCache.timestamp < TTL) {
    return res.status(200).json(statsCache.data);
  }

  try {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 30);

    const results = await Promise.all(
      SYMBOLS.map(async (sym) => {
        const hist = await yahooFinance.historical(sym, { period1: start, period2: end, interval: '1d' });
        const sorted = hist.filter(h => h.close != null).sort((a, b) => a.date.getTime() - b.date.getTime());
        const y = sorted.at(-1)!, b = sorted.at(-2)!;
        const pct = (((y.close! - b.close!) / b.close!) * 100).toFixed(2);
        const rsiList = RSI.calculate({ values: sorted.map(h => h.close!), period: 14 });
        return {
          symbol: sym,
          dayBeforeDate: format(b.date, 'yyyy-MM-dd'),
          dayBeforeClose: b.close!,
          yesterdayDate: format(y.date, 'yyyy-MM-dd'),
          yesterdayClose: y.close!,
          percentageChange: pct,
          rsi: rsiList.at(-1)!.toFixed(2),
        };
      })
    );

    statsCache = { timestamp: now, data: results };
    return res.status(200).json(results);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
