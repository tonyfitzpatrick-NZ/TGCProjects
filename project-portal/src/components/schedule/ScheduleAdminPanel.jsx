// ============================================================
// ScheduleAdminPanel.jsx
// Admin-only panel for adding/editing/deleting item options
// and linking CodeMark / BRANZ / manual documents.
// Only rendered when userRole === 'admin'
// ============================================================

import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Edit2 } from 'lucide-react';
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
      const { data, error: queryError } = await supabase
        .from('v_sched_master')
        .select('*')
        .order('section_order, item_order');   // using columns that exist

      if (queryError) throw queryError;

      const grouped = (data || []).reduce((acc, row) => {
        let section = acc.find(s => s.name === row.section);
        if (!section) {
          section = { name: row.section, items: [] };
          acc.push(section);
        }

        let item = section.items.find(i => i.label === row.item);
        if (!item) {
          item = { 
            label: row.item, 
            cbi_code: row.cbi_code || '', 
            options: [] 
          };
          section.items.push(item);
        }

        if (row.option_id) {
          item.options.push({
            id: row.option_id,
            label: row.option_label,
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
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const deleteOption = async (id) => {
    if (!window.confirm('Delete this option?')) return;
    const { error } = await supabase.from('sched_item_options').delete().eq('id', id);
    if (error) alert('Delete failed');
    else loadData();
  };

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}>Loading master data...</div>;

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Master Schedule — All Sections & Products</h2>
        <button onClick={loadData} style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: 8 }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px' }}>
          Error: {error}
        </div>
      )}

      {sections.map(section => (
        <div key={section.name} style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '22px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '20px' }}>
            {section.name}
          </h3>

          {section.items.map(item => (
            <div key={item.label} style={{ 
              background: '#fff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px', 
              padding: '20px', 
              marginBottom: '24px' 
            }}>
              <div style={{ marginBottom: '16px' }}>
                <strong>{item.label}</strong>
                {item.cbi_code && <span style={{ marginLeft: '12px', color: '#64748b' }}>CBI: {item.cbi_code}</span>}
              </div>

              {item.options && item.options.length > 0 ? (
                item.options.map(opt => (
                  <div key={opt.id} style={{ 
                    padding: '14px', 
                    background: '#f8fafc', 
                    borderRadius: '8px', 
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{opt.label}</div>
                      {opt.detail && <div style={{ fontSize: '13px', color: '#444' }}>{opt.detail}</div>}
                      {(opt.supplier || opt.warranty) && (
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>
                          {opt.supplier && `Supplier: ${opt.supplier}`} 
                          {opt.warranty && ` | Warranty: ${opt.warranty}`}
                        </div>
                      )}
                    </div>
                    <div>
                      <button onClick={() => alert('Full edit form coming next')} style={{ color: '#3b82f6', marginRight: '12px' }}>
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => deleteOption(opt.id)} style={{ color: '#ef4444' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#888' }}>No options yet</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
