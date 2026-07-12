import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PartyTransactionsView from './PartyTransactionsView';
import { Loader2 } from 'lucide-react';

export default function SalesScreen({ navigateTo, setEditingBillId }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBills();
  }, []);

  async function fetchBills() {
    try {
      const res = await axios.get(`/api/bills?t=${Date.now()}`);
      // Filter only Sales bills
      const salesBills = res.data.filter(b => b.bill_type === 'Sales');
      setBills(salesBills);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch sales bills.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-rose-400">{error}</div>;
  }

  return (
    <PartyTransactionsView 
      title="Parties (Sales)" 
      type="customer" 
      bills={bills} 
      transactionLabel="Sale"
      onStatusChange={fetchBills}
      navigateTo={navigateTo}
      setEditingBillId={setEditingBillId}
    />
  );
}
