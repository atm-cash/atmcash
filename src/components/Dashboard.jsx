import React, { useState, useEffect } from 'react';
import transactionsData from '../data/transactions.json';

function Dashboard() {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const total = transactionsData.reduce((acc, tx) => acc + tx.amount, 0);
    setBalance(total);
  }, []);

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h2 className="text-xl font-bold">Saldo: {balance} DKK</h2>
    </div>
  );
}

export default Dashboard;