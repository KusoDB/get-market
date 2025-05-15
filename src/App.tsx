import React, { useEffect, useState } from 'react';

interface FGIResponse {
  fgi: {
    now: { value: number; valueText: string };
  };
}

interface NDXChange {
  lastFridayDate: string;
  lastFridayClose: number;
  twoWeeksAgoDate: string;
  twoWeeksAgoClose: number;
  percentageChange: string;
}

type Stat = {
  symbol: string;
  dayBeforeDate: string;
  dayBeforeClose: number;
  yesterdayDate: string;
  yesterdayClose: number;
  percentageChange: string;
  rsi: string;
};

export default function App() {
  const [fgiData, setFgiData] = useState<FGIResponse | null>(null);
  const [ndxChange, setNdxChange] = useState<NDXChange | null>(null);
  const [stats, setStats] = useState<Stat[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/fgi')
      .then(res => (res.ok ? res.json() : Promise.reject('FGI fetch failed')))
      .then(data => setFgiData(data))
      .catch(() => setError('FGI取得失敗'));

    fetch('/api/ndx-change')
      .then(res => (res.ok ? res.json() : Promise.reject('NDX fetch failed')))
      .then((data: NDXChange) => setNdxChange(data))
      .catch(() => setError('NDX取得失敗'));

    fetch('/api/market-stats')
      .then(res => (res.ok ? res.json() : Promise.reject('Market fetch failed')))
      .then(data => setStats(data))
      .catch(() => setError('Market取得失敗'));
  }, []);

  if (error) return <p className="p-4 text-red-500">Error: {error}</p>;
  if (!fgiData || !ndxChange || stats.length === 0) return <p className="p-4">Loading…</p>;

  const clean = (s: string) => (s.startsWith('^') ? s.slice(1) : s);
  const date1 = stats[0]?.dayBeforeDate ?? 'N/A';
  const date2 = stats[0]?.yesterdayDate ?? 'N/A';

  return (
    <div className="p-6 space-y-6">
      {/* FGI Section */}
      <section>
        <h2 className="text-xl font-bold">Fear & Greed Index</h2>
        <p>
          {fgiData?.fgi.now.value} ({fgiData?.fgi.now.valueText})
        </p>
      </section>

      {/* NDX Weekly Change Section */}
      <section>
        <h2 className="text-xl font-bold">NDX Weekly Change</h2>
        <p>
          Last Friday ({ndxChange?.lastFridayDate}): {ndxChange?.lastFridayClose.toLocaleString()}
        </p>
        <p>
          Two Weeks Ago ({ndxChange?.twoWeeksAgoDate}): {ndxChange?.twoWeeksAgoClose.toLocaleString()}
        </p>
        <p>Change: {parseFloat(ndxChange?.percentageChange ?? '0').toFixed(2)}%</p>
      </section>

      {/* Market Stats Table */}
      <section>
        <h2 className="text-xl font-bold">Market Stats</h2>
        <table className="border-collapse border w-full">
          <thead>
            <tr>
              <th className="border px-2">Symbol</th>
              <th className="border px-2">{date1}</th>
              <th className="border px-2">{date2}</th>
              <th className="border px-2">Change(%)</th>
              <th className="border px-2">RSI(14)</th>
            </tr>
          </thead>
          <tbody>
            {stats.map(s => (
              <tr key={s.symbol}>
                <td className="border px-2">{clean(s.symbol)}</td>
                <td className="border px-2">{s.dayBeforeClose.toLocaleString()}</td>
                <td className="border px-2">{s.yesterdayClose.toLocaleString()}</td>
                <td className="border px-2">{parseFloat(s.percentageChange).toFixed(2)}%</td>
                <td className="border px-2">{s.rsi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
