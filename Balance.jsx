import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard/Dashboard';
import Transactions from './components/Transactions/Transactions';
import CurrencyConverter from './components/CurrencyConverter/CurrencyConverter';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-4">
        <Dashboard />
        <CurrencyConverter />
        <Transactions />
      </main>
      <Footer />
    </div>
  );
}

export default App;