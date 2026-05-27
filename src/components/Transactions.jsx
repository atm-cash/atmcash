import React from 'react';
import transactionsData from '../data/transactions.json';

function Transactions() {
  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h2 className="text-lg font-semibold mb-2">Transaktioner</h2>
      <ul>
        {transactionsData.map((tx, index) => (
          <li key={index}>{tx.date}: {tx.amount} DKK - {tx.description}</li>
        ))}
      </ul>
    </div>
  );
}

export default Transactions;