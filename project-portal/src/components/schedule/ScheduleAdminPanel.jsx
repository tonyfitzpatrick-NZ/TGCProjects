// ============================================================
// ScheduleAdminPanel.jsx
// Admin-only panel for adding/editing/deleting item options
// and linking CodeMark / BRANZ / manual documents.
// Only rendered when userRole === 'admin'
// ============================================================

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, RefreshCw, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ScheduleAdminPanel() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOption, setEditingOption] = useState(null); // {id, data}

  useEffect(() => {
    loadMasterData();
  }, []);

  async function loadMasterData() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('v_sched_master')
        .select('*')
        .order('section_order, item_order, sort_order');

      const grouped = (data || []).reduce((acc, row) => {
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

      setSections(grouped.sort((a, b) => a.sort_order - b.sort_order));
    } catch (e) {
      console.error(e);
      alert("Failed to load master data");
    } finally {
      setLoading(false);
    }
  }

  const saveOption = async (option) => {
    const { error } = await supabase
      .from('sched_item_options')
      .update({
        label: option.label,
        detail: option.detail,
        warranty: option.warranty,
        supplier: option.supplier,
        model_ref: option.model_ref
      })
      .eq('id', option.id);

    if (error) alert('Save failed');
    else {
      setEditingOption(null);
      loadMasterData();
    }
  };

  const deleteOption = async (optionId) => {
    if (!window.confirm('Delete this option permanently?')) return;
    await supabase.from('sched_item_options').delete().eq('id', optionId);
    loadMasterData();
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <h2>Master Schedule — Editable</h2>
        <button onClick={loadMasterData} style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: 8 }}>
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
              <div style={{ marginBottom: '16px' }}>
                <strong>{item.label}</strong>
                {item.cbi_code && <span style={{ marginLeft: '12px', color: '#64748b' }}>CBI: {item.cbi_code}</span>}
              </div>

              {item.options.map(opt => (
                <div key={opt.id} style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', marginBottom: '12px' }}>
                  {editingOption && editingOption.id === opt.id ? (
                    // Edit Form
                    <div>
                      <input
                        value={editingOption.label}
                        onChange={e => setEditingOption({...editingOption, label: e.target.value})}
                        style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px' }}
                        placeholder="Option label"
                      />
                      <textarea
                        value={editingOption.detail || ''}
                        onChange={e => setEditingOption({...editingOption, detail: e.target.value})}
                        style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', minHeight: '60px' }}
                        placeholder="Full specification detail"
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <input value={editingOption.supplier || ''} onChange={e => setEditingOption({...editingOption, supplier: e.target.value})} placeholder="Supplier" />
                        <input value={editingOption.warranty || ''} onChange={e => setEditingOption({...editingOption, warranty: e.target.value})} placeholder="Warranty" />
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <button onClick={() => saveOption(editingOption)} style={{ background: '#166534', color: '#fff', padding: '6px 16px', borderRadius: '6px', marginRight: '8px' }}>Save</button>
                        <button onClick={() => setEditingOption(null)} style={{ padding: '6px 16px' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    // Display Row
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{opt.label}</div>
                        {opt.detail && <div style={{ fontSize: '13px' }}>{opt.detail}</div>}
                        {opt.supplier && <div>Supplier: {opt.supplier}</div>}
                        {opt.warranty && <div>Warranty: {opt.warranty}</div>}
                      </div>
                      <div>
                        <button onClick={() => setEditingOption({...opt})} style={{ color: '#3b82f6', marginRight: '12px' }}>
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => deleteOption(opt.id)} style={{ color: '#ef4444' }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
