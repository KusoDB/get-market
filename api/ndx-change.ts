import { VercelRequest, VercelResponse } from "@vercel/node";
import yahooFinance from "yahoo-finance2";
import { format, subDays } from "date-fns";

const SYMBOL = "^NDX";

// 今日を含めた「直近の金曜日」を返す
function getLastFriday(date: Date): Date {
  const diff = (date.getDay() - 5 + 7) % 7;
  return subDays(date, diff);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const now = new Date();

  // —— ここがポイント —— 
  // ❌ NG: getLastFriday(subDays(now, 7))
  // ✅ OK:  getLastFriday(now)
  const lastFriday = getLastFriday(now);
  const lastFridayStr = format(lastFriday, "yyyy-MM-dd");  // → "2025-05-09"

  // 先々週金曜は、上で取った金曜から 7 日引くだけ
  const twoWeeksAgoFriday = subDays(lastFriday, 7);
  const twoWeeksAgoFridayStr = format(twoWeeksAgoFriday, "yyyy-MM-dd");  // → "2025-05-02"

  // あとはいつものチャート取得ロジック
  const chartData = await yahooFinance.chart(SYMBOL, {
    period1: twoWeeksAgoFridayStr,
    period2: lastFridayStr,
    interval: "1d",
  });

  const quotes = chartData?.quotes ?? [];
  if (!quotes.length) {
    return res.status(404).json({ error: "データ取得に失敗しました。" });
  }

  const twoWeeksAgoClose = quotes[0].close!;
  const lastFridayClose  = quotes[quotes.length - 1].close!;
  const changePct = ((lastFridayClose - twoWeeksAgoClose) / twoWeeksAgoClose) * 100;

  return res.status(200).json({
    lastFridayDate:      lastFridayStr,
    lastFridayClose,
    twoWeeksAgoDate:     twoWeeksAgoFridayStr,
    twoWeeksAgoClose,
    percentageChange:    changePct.toFixed(2),
  });
}
