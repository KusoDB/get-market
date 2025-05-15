import { VercelRequest, VercelResponse } from "@vercel/node";
import yahooFinance from "yahoo-finance2";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const symbol = req.query.symbol as string || "AAPL";

  try {
    // 株価データ取得
    const quote = await yahooFinance.quote(symbol);
    res.status(200).json(quote);
  } catch (error) {
    console.error("Error fetching stock data:", error);
    res.status(500).json({ error: "Error fetching stock data" });
  }
}
