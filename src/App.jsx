import React from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import CurrencyConverter from './components/CurrencyConverter';
import Footer from './components/Footer';

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