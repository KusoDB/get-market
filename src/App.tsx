// src/App.tsx
import React, { useEffect, useState } from 'react'
import { NaaimWidget } from './components/NaaimWidget'

interface FGIResponse {
  fgi: {
    now: { value: number; valueText: string }
  }
}

interface NDXChange {
  lastFridayDate: string
  lastFridayClose: number
  twoWeeksAgoDate: string
  twoWeeksAgoClose: number
  percentageChange: string
}

type Stat = {
  symbol: string
  dayBeforeDate: string
  dayBeforeClose: number
  yesterdayDate: string
  yesterdayClose: number
  percentageChange: string
  rsi: string
}

export default function App() {
  const [fgiData, setFgiData] = useState<FGIResponse | null>(null)
  const [ndxChange, setNdxChange] = useState<NDXChange | null>(null)
  const [stats, setStats] = useState<Stat[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/fgi')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => setFgiData(data))
      .catch(() => setError('FGI取得失敗'))

    fetch('/api/ndx-change')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then((data: NDXChange) => setNdxChange(data))
      .catch(() => setError('NDX取得失敗'))

    fetch('/api/market-stats')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => setStats(data))
      .catch(() => setError('Market取得失敗'))
  }, [])

  if (error) {
    return <p className="p-4 text-red-500">Error: {error}</p>
  }
  if (!fgiData || !ndxChange || stats.length === 0) {
    return <p className="p-4">Loading…</p>
  }

  const clean = (s: string) => (s.startsWith('^') ? s.slice(1) : s)
  const date1 = stats[0].dayBeforeDate
  const date2 = stats[0].yesterdayDate

  return (
    <div className="p-6 space-y-6 bg-gray-100 dark:bg-gray-800 min-h-screen">
      {/* Fear & Greed Index */}
      <section className="flex flex-col bg-white border border-gray-200 shadow-md rounded-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="bg-gray-100 border-b border-gray-200 rounded-t-xl py-3 px-4 dark:bg-gray-700 dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Fear &amp; Greed Index
          </p>
        </div>
        <div className="p-4 md:p-5 text-gray-800 dark:text-white">
         {/* NAAIMと同じサイズ・ウェイトに合わせる */}
         <p className="text-lg font-normal">
           {fgiData.fgi.now.value} ({fgiData.fgi.now.valueText})
        </p>
       </div>
      </section>

      {/* NAAIM Exposure Index */}
      <section className="flex flex-col bg-white border border-gray-200 shadow-md rounded-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="bg-gray-100 border-b border-gray-200 rounded-t-xl py-3 px-4 dark:bg-gray-700 dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-300">
            NAAIM Exposure Index
          </p>
        </div>
        <div className="p-4 md:p-5 text-gray-800 dark:text-white">
          <NaaimWidget />
        </div>
      </section>

      {/* NDX Weekly Change */}
      <section className="flex flex-col bg-white border border-gray-200 shadow-md rounded-xl dark:bg-gray-800 dark:border-gray-700">
        <div className="bg-gray-100 border-b border-gray-200 rounded-t-xl py-3 px-4 dark:bg-gray-700 dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-300">
            NDX Weekly Change
          </p>
        </div>
        <div className="p-4 md:p-5 space-y-2 text-gray-800 dark:text-white">
          <div className="flex justify-between">
            <span className="font-medium">
              Two Weeks Ago ({ndxChange.twoWeeksAgoDate}):
            </span>
            <span>{ndxChange.twoWeeksAgoClose.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">
              Last Friday ({ndxChange.lastFridayDate}):
            </span>
            <span>{ndxChange.lastFridayClose.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Change:</span>
            <span>{parseFloat(ndxChange.percentageChange).toFixed(2)}%</span>
          </div>
        </div>
      </section>

      {/* Market Stats (horizontal lines removed) */}
      <section className="flex flex-col bg-white border border-gray-200 shadow-md rounded-xl dark:bg-neutral-900 dark:border-gray-700">
        <div className="bg-gray-100 border-b border-gray-200 rounded-t-xl py-3 px-4 dark:bg-gray-700 dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-300">Market Stats</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-800 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Symbol</th>
                <th className="px-6 py-3">{date1}</th>
                <th className="px-6 py-3">{date2}</th>
                <th className="px-6 py-3">Change(%)</th>
                <th className="px-6 py-3">RSI(14)</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr
                  key={s.symbol}
                  className={
                    i % 2 === 0
                      ? 'bg-white dark:bg-gray-900'
                      : 'bg-gray-50 dark:bg-gray-800'
                  }
                >
                  <td className="px-6 py-4">{clean(s.symbol)}</td>
                  <td className="px-6 py-4">
                    {s.dayBeforeClose.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {s.yesterdayClose.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    {parseFloat(s.percentageChange).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4">{s.rsi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
