// ============================================================
// ScheduleAdminPanel.jsx
// Admin-only panel for adding/editing/deleting item options
// and linking CodeMark / BRANZ / manual documents.
// Only rendered when userRole === 'admin'
// ============================================================

import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ScheduleAdminPanel() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

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
        let section = acc.find(s => s.name === row.section);
        if (!section) {
          section = { name: row.section, items: [] };
          acc.push(section);
        }

        let item = section.items.find(i => i.label === row.item);
        if (!item) {
          item = { label: row.item, cbi_code: row.cbi_code, options: [] };
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

  const startEdit = (opt) => {
    setEditingId(opt.id);
    setEditForm({ ...opt });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from('sched_item_options')
      .update({
        label: editForm.label,
        detail: editForm.detail,
        warranty: editForm.warranty,
        supplier: editForm.supplier,
        model_ref: editForm.model_ref
      })
      .eq('id', editingId);

    if (error) {
      alert('Save failed: ' + error.message);
    } else {
      setEditingId(null);
      loadData();
    }
  };

  const deleteOption = async (id) => {
    if (!window.confirm('Delete this option?')) return;
    await supabase.from('sched_item_options').delete().eq('id', id);
    loadData();
  };

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}>Loading master schedule...</div>;

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
        <h2>Master Schedule — Editable</h2>
        <button onClick={loadData} style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: 8 }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div style={{ padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

      {sections.map(section => (
        <div key={section.name} style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '22px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            {section.name}
          </h3>

          {section.items.map(item => (
            <div key={item.label} style={{ 
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' 
            }}>
              <strong>{item.label}</strong>
              {item.cbi_code && <span style={{ marginLeft: '12px', color: '#64748b' }}>CBI: {item.cbi_code}</span>}

              {item.options.map(opt => (
                <div key={opt.id} style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', marginTop: '12px' }}>
                  {editingId === opt.id ? (
                    <div>
                      <input value={editForm.label || ''} onChange={e => setEditForm({...editForm, label: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'8px'}} placeholder="Label" />
                      <textarea value={editForm.detail || ''} onChange={e => setEditForm({...editForm, detail: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'8px', minHeight:'70px'}} placeholder="Detail / Specification" />
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                        <input value={editForm.supplier || ''} onChange={e => setEditForm({...editForm, supplier: e.target.value})} placeholder="Supplier" />
                        <input value={editForm.warranty || ''} onChange={e => setEditForm({...editForm, warranty: e.target.value})} placeholder="Warranty" />
                      </div>
                      <div style={{marginTop:'12px'}}>
                        <button onClick={saveEdit} style={{background:'#166534', color:'white', padding:'6px 16px', borderRadius:'6px', marginRight:'8px'}}>Save</button>
                        <button onClick={() => setEditingId(null)} style={{padding:'6px 16px'}}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                      <div>
                        <div style={{fontWeight:500}}>{opt.label}</div>
                        {opt.detail && <div style={{fontSize:'13px'}}>{opt.detail}</div>}
                        {opt.supplier && <div>Supplier: {opt.supplier}</div>}
                        {opt.warranty && <div>Warranty: {opt.warranty}</div>}
                      </div>
                      <div>
                        <button onClick={() => startEdit(opt)} style={{color:'#3b82f6', marginRight:'12px'}}><Edit2 size={18}/></button>
                        <button onClick={() => deleteOption(opt.id)} style={{color:'#ef4444'}}><Trash2 size={18}/></button>
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
