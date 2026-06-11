// ============================================================
// ScheduleAdminPanel.jsx
// Admin-only panel for adding/editing/deleting item options
// and linking CodeMark / BRANZ / manual documents.
// Only rendered when userRole === 'admin'
// ============================================================

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ScheduleAdminPanel({ onRefresh }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('v_sched_master')
        .select('*')
        .order('section_order, item_order, sort_order');

      // Group data
      const grouped = data.reduce((acc, row) => {
        let section = acc.find(s => s.name === row.section);
        if (!section) {
          section = { name: row.section, sort_order: row.section_order, items: [] };
          acc.push(section);
        }

        let item = section.items.find(i => i.label === row.item);
        if (!item) {
          item = {
            label: row.item,
            cbi_code: row.cbi_code,
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
      alert("Failed to load schedule data");
    } finally {
      setLoading(false);
    }
  }

  const handleAIResearch = (item, option) => {
    const q = option ? `${item} ${option}` : item;
    alert(`🔍 AI Research for: "${q}"\n\n(In future this will automatically search for datasheets, CodeMark, BRANZ, etc.)`);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading master schedule...</div>;

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Master Schedule Management</h2>
        <button onClick={loadData} style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: 8 }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {sections.map(section => (
        <div key={section.name} style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '22px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            {section.name}
          </h3>

          {section.items.map(item => (
            <div key={item.label} style={{ 
              background: '#fff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px', 
              padding: '20px', 
              marginBottom: '20px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <strong>{item.label}</strong>
                  {item.cbi_code && <span style={{ marginLeft: '12px', color: '#64748b', fontSize: '13px' }}>CBI {item.cbi_code}</span>}
                </div>
                <button 
                  onClick={() => handleAIResearch(item.label)}
                  style={{ color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  🔍 AI Research
                </button>
              </div>

              {item.options && item.options.length > 0 ? (
                item.options.map(opt => (
                  <div key={opt.id} style={{ 
                    padding: '12px', 
                    background: '#f8fafc', 
                    borderRadius: '8px', 
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{opt.label}</div>
                      <div style={{ fontSize: '13px', color: '#666' }}>{opt.detail}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleAIResearch(item.label, opt.label)} style={{ color: '#3b82f6' }}>Suggest</button>
                      <button style={{ color: '#eab308' }}><Edit2 size={16} /></button>
                      <button style={{ color: '#ef4444' }} onClick={() => alert('Delete coming soon')}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#888', fontStyle: 'italic' }}>No options yet</p>
              )}

              <button style={{ marginTop: '12px', color: '#7c3aed', background: 'none', border: '1px dashed #c4b5fd', padding: '8px 16px', borderRadius: '8px' }}>
                + Add Option
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
