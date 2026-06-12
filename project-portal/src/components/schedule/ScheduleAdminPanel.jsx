import React, { useState, useEffect } from 'react';
import { RefreshCw, Edit2, X, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ScheduleAdminPanel({ activeTab = 'options' }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === 'options') {
        const { data: rows } = await supabase.from('v_sched_master').select('*').order('section_order, item_order');
        setData(rows || []);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: '40px', color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      <h2>Master Schedule — Options & Products</h2>
      {data.map((row, index) => (
        <div key={index} style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '12px' }}>
          <strong>{row.option_label}</strong>
          {row.detail && <div>{row.detail}</div>}
        </div>
      ))}
    </div>
  );
}
