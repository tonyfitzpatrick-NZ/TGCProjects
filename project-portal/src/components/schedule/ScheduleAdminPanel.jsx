// ============================================================
// ScheduleAdminPanel.jsx
// Admin-only panel for adding/editing/deleting item options
// and linking CodeMark / BRANZ / manual documents.
// Only rendered when userRole === 'admin'
// ============================================================

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ScheduleAdminPanel({ activeTab }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      let query;
      if (activeTab === 'options') {
        query = supabase.from('v_sched_master').select('*').order('section_order, item_order');
      } else if (activeTab === 'items') {
        query = supabase.from('sched_items').select('*, sched_sections(name)').order('sort_order');
      } else if (activeTab === 'sections') {
        query = supabase.from('sched_sections').select('*').order('sort_order');
      } else if (activeTab === 'templates') {
        query = supabase.from('sched_templates').select('*');
      }

      const { data, error } = await query;
      if (error) throw error;
      setData(data || []);
    } catch (e) {
      console.error(e);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  const deleteRecord = async (table, id) => {
    if (!window.confirm('Delete this record?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) alert('Delete failed');
    else loadData();
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Loading data...</div>;

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
        <button onClick={loadData} style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: 8 }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {activeTab === 'options' && (
        <div>
          {data.map((row, i) => (
            <div key={i} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '12px', background: '#fff' }}>
              <strong>{row.section} → {row.item}</strong><br />
              <span style={{ color: '#1a202c' }}>{row.option_label}</span>
              {row.detail && <div style={{ fontSize: '13px', marginTop: '4px' }}>{row.detail}</div>}
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                {row.warranty && `Warranty: ${row.warranty} | `}
                {row.supplier && `Supplier: ${row.supplier}`}
              </div>
              <button onClick={() => deleteRecord('sched_item_options', row.option_id)} style={{ float: 'right', color: 'red', marginTop: '-20px' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'items' && data.map(item => (
        <div key={item.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '12px' }}>
          <strong>{item.label}</strong> (CBI: {item.cbi_code})
          <button onClick={() => deleteRecord('sched_items', item.id)} style={{ float: 'right', color: 'red' }}>
            Delete
          </button>
        </div>
      ))}

      {activeTab === 'sections' && data.map(section => (
        <div key={section.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '12px' }}>
          {section.name} (Order: {section.sort_order})
        </div>
      ))}

      {activeTab === 'templates' && data.map(t => (
        <div key={t.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '12px' }}>
          {t.name} - {t.description}
        </div>
      ))}

      <p style={{ marginTop: '40px', textAlign: 'center', color: '#888' }}>
        Full inline editing (CBI codes, descriptions, links, etc.) coming in next update.
      </p>
    </div>
  );
}
