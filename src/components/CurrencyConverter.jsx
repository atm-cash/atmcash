import React, { useState } from 'react';

function CurrencyConverter() {
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState(0);

  const convert = () => {
    setResult(amount);
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h2 className="text-lg font-semibold mb-2">Valutaomregner</h2>
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="border p-1 mr-2"/>
      <button onClick={convert} className="bg-blue-500 text-white px-2 rounded">Konverter</button>
      <p className="mt-2">Resultat: {result}</p>
    </div>
  );
}

export default CurrencyConverter;