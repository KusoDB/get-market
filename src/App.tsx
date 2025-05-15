import { useState } from "react";
import "./App.css";

function App() {
  const [symbol, setSymbol] = useState("");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  const fetchStockData = async () => {
    try {
      const response = await fetch(`/api/stock?symbol=${symbol}`);
      const result = await response.json();

      if (result.error) {
        setError(result.error);
        setData(null);
      } else {
        setData(result);
        setError("");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch data");
      setData(null);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Yahoo Finance Data Fetcher</h1>
      <div className="mb-4">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Enter stock symbol (e.g., AAPL)"
          className="border p-2 mr-2"
        />
        <button onClick={fetchStockData} className="bg-blue-500 text-white px-4 py-2">
          Fetch Data
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {data && (
        <div className="mt-4">
          <h2 className="text-lg font-bold">Stock Data for {data.symbol}</h2>
          <p>Price: ${data.regularMarketPrice}</p>
          <p>Previous Close: ${data.regularMarketPreviousClose}</p>
          <p>Change: {data.regularMarketChangePercent.toFixed(2)}%</p>
        </div>
      )}
    </div>
  );
}

export default App;
