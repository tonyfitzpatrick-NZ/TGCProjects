// ============================================================
// ScheduleAdminPanel.jsx
// Admin-only panel for adding/editing/deleting item options
// and linking CodeMark / BRANZ / manual documents.
// Only rendered when userRole === 'admin'
// ============================================================

import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Edit2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ScheduleAdminPanel() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const { data } = await supabase
        .from('v_sched_master')
        .select('*')
        .order('section_order, item_order');

      const grouped = (data || []).reduce((acc, row) => {
        let section = acc.find(s => s.name === row.section);
        if (!section) {
          section = { name: row.section, items: [] };
          acc.push(section);
        }

        let item = section.items.find(i => i.id === row.item_id);
        if (!item) {
          item = { id: row.item_id, label: row.item, cbi_code: row.cbi_code, options: [] };
          section.items.push(item);
        }

        if (row.option_id) {
          item.options.push({
            id: row.option_id,
            label: row.option_label,
            detail: row.detail,
            warranty: row.warranty,
            supplier: row.supplier,
            product_link: row.product_link
          });
        }
        return acc;
      }, []);

      setSections(grouped);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const deleteOption = async (id) => {
    if (!window.confirm('Delete?')) return;
    await supabase.from('sched_item_options').delete().eq('id', id);
    loadData();
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <h2>Master Schedule</h2>
        <button onClick={loadData}><RefreshCw size={16} /> Refresh</button>
      </div>

      {error && <div style={{ color: 'red', padding: '10px' }}>{error}</div>}

      {sections.map(section => (
        <div key={section.name} style={{ marginBottom: '40px' }}>
          <h3>{section.name}</h3>
          {section.items.map(item => (
            <div key={item.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
              <strong>{item.label}</strong> {item.cbi_code && `(CBI: ${item.cbi_code})`}
              {item.options.map(opt => (
                <div key={opt.id} style={{ padding: '10px', background: '#f8f8f8', marginTop: '10px', borderRadius: '6px' }}>
                  {opt.label}
                  <button onClick={() => deleteOption(opt.id)} style={{ float: 'right', color: 'red' }}>Delete</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
