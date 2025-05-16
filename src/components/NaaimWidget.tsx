import { useEffect, useState } from 'react';

export function NaaimWidget() {
  const [value, setValue] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/naaim')
      .then(res => res.json())
      .then(data => setValue(data.naaimExposureIndex))
      .catch(console.error);
  }, []);

  if (value === null) return <div>Loading...</div>;
  return (
    <div>
      <h2>NAAIM Exposure Index</h2>
      <p>{value.toFixed(2)}</p>
    </div>
  );
}
