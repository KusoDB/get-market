import type { VercelRequest, VercelResponse } from '@vercel/node';
import yahooFinance from 'yahoo-finance2';
import { format, subDays } from 'date-fns';

type NdxPayload = {
  lastFridayDate: string;
  lastFridayClose: number;
  twoWeeksAgoDate: string;
  twoWeeksAgoClose: number;
  percentageChange: string;
  fetchedAt: string;
  cache: boolean;
};

const TTL = 24 * 60 * 60 * 1000;
let ndxCache: { timestamp: number; data: NdxPayload } | null = null;

function getLastFriday(date: Date): Date {
  const diff = (date.getDay() - 5 + 7) % 7;
  return subDays(date, diff);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const now = Date.now();
  if (ndxCache && now - ndxCache.timestamp < TTL) {
    return res.status(200).json(ndxCache.data);
  }

  try {
    const today = new Date();
    const lastFri = getLastFriday(today);
    const twoWeeksAgo = subDays(lastFri, 7);
    const lastFriStr = format(lastFri, 'yyyy-MM-dd');
    const twoWeeksStr = format(twoWeeksAgo, 'yyyy-MM-dd');

    const chartData = await yahooFinance.chart('^NDX', {
      period1: twoWeeksStr,
      period2: lastFriStr,
      interval: '1d',
    });
    const quotes = chartData?.quotes ?? [];
    if (!quotes.length) throw new Error('No data');

    const firstClose = quotes[0].close!;
    const lastClose = quotes[quotes.length - 1].close!;
    const pct = (((lastClose - firstClose) / firstClose) * 100).toFixed(2);

    const payload: NdxPayload = {
      lastFridayDate: lastFriStr,
      lastFridayClose: lastClose,
      twoWeeksAgoDate: twoWeeksStr,
      twoWeeksAgoClose: firstClose,
      percentageChange: pct,
      fetchedAt: new Date(now).toISOString(),
      cache: false,
    };

    ndxCache = { timestamp: now, data: payload };
    return res.status(200).json(payload);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
