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
      const { data, error: qError } = await supabase
        .from('v_sched_master')
        .select('*')
        .order('section_order, item_order');

      if (qError) throw qError;

      const grouped = (data || []).reduce((acc, row) => {
        const sectionName = row.section || 'Unknown Section';
        let section = acc.find(s => s.name === sectionName);
        if (!section) {
          section = { name: sectionName, items: [] };
          acc.push(section);
        }

        const itemLabel = row.item || 'Unknown Item';
        let item = section.items.find(i => i.label === itemLabel);
        if (!item) {
          item = { 
            id: row.item_id,
            label: itemLabel, 
            cbi_code: row.cbi_code || '', 
            options: [] 
          };
          section.items.push(item);
        }

        if (row.option_id) {
          item.options.push({
            id: row.option_id,
            label: row.option_label || 'Unnamed Option',
            detail: row.detail,
            warranty: row.warranty,
            supplier: row.supplier,
            model_ref: row.model_ref
          });
        }
        return acc;
      }, []);

      setSections(grouped);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Unknown error loading data');
    } finally {
      setLoading(false);
    }
  }

  const deleteOption = async (id) => {
    if (!window.confirm('Delete this option?')) return;
    await supabase.from('sched_item_options').delete().eq('id', id);
    loadData();
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center', fontSize: '17px' }}>Loading master schedule...</div>;

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Master Schedule</h2>
        <button onClick={loadData} style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: 8 }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {sections.map((section, sIndex) => (
        <div key={sIndex} style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '22px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            {section.name}
          </h3>

          {section.items.map((item, iIndex) => (
            <div key={iIndex} style={{ 
              background: '#fff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px', 
              padding: '20px', 
              marginBottom: '20px' 
            }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>{item.label}</strong>
                {item.cbi_code && <span style={{ marginLeft: '12px', color: '#64748b' }}>CBI: {item.cbi_code}</span>}
              </div>

              {item.options && item.options.length > 0 ? (
                item.options.map(opt => (
                  <div key={opt.id} style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{opt.label}</div>
                      {opt.detail && <div style={{ fontSize: '13px' }}>{opt.detail}</div>}
                      {opt.supplier && <div>Supplier: {opt.supplier}</div>}
                      {opt.warranty && <div>Warranty: {opt.warranty}</div>}
                    </div>
                    <button onClick={() => deleteOption(opt.id)} style={{ color: '#ef4444' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ color: '#888', fontStyle: 'italic' }}>No options yet</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
