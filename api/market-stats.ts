import type { VercelRequest, VercelResponse } from "@vercel/node";
import yahooFinance from "yahoo-finance2";
import { format } from "date-fns";
import { RSI } from "technicalindicators";

const SYMBOLS = ["^NDX", "^SOX", "XLK", "^VIX"];
const RSI_PERIOD = 14;

// 過去30営業日分くらい取れば、直近2日＋RSI14日分をカバーできます
const LOOKBACK_DAYS = 30;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - LOOKBACK_DAYS);

    // 全シンボルを並列フェッチ
    const data = await Promise.all(
      SYMBOLS.map(async (symbol) => {
        // 過去 LOOKBACK_DAYS 日〜今日までの OHLCV
        const history = await yahooFinance.historical(symbol, {
          period1: fromDate,
          period2: now,
          interval: "1d",
        });

        // 日付昇順にソート & クローズだけ抽出
        const sorted = history
          .filter((h) => h.close != null)
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        // 要素数チェック
        if (sorted.length < RSI_PERIOD + 2) {
          throw new Error(`${symbol} のデータが足りません (${sorted.length} 件)`);
        }

        // ---- 1) 一昨日 & 昨日 終値 ----
        const yesterday = sorted[sorted.length - 1];
        const dayBefore = sorted[sorted.length - 2];
        const pctChange =
          ((yesterday.close! - dayBefore.close!) / dayBefore.close!) * 100;

        // ---- 2) RSI 計算 ----
        const closeValues = sorted.map((h) => h.close!) as number[];
        const rsiValues = RSI.calculate({
          values: closeValues,
          period: RSI_PERIOD,
        });
        const latestRsi = rsiValues[rsiValues.length - 1];

        return {
          symbol,
          dayBeforeDate: format(dayBefore.date, "yyyy-MM-dd"),
          dayBeforeClose: dayBefore.close,
          yesterdayDate: format(yesterday.date, "yyyy-MM-dd"),
          yesterdayClose: yesterday.close,
          percentageChange: pctChange.toFixed(2),
          rsi: latestRsi.toFixed(2),
        };
      })
    );

    // CDN に 24時間キャッシュさせるヘッダー
    res.setHeader(
      'Cache-Control',
      'public, max-age=0, s-maxage=86400, stale-while-revalidate=3600'
    );

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Error in market-stats:", error);
    return res.status(500).json({ error: error.message });
  }
}
