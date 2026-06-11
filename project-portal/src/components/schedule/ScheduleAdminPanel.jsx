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

  const [editingOptionId, setEditingOptionId] = useState(null);
  const [editOptionForm, setEditOptionForm] = useState({});

  const [addingOptionToItem, setAddingOptionToItem] = useState(null);
  const [newOptionForm, setNewOptionForm] = useState({ 
    label: '', detail: '', warranty: '', supplier: '', model_ref: '', 
    product_link: '', codemark_link: '', branz_link: '', certificate_notes: '' 
  });

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
            product_link: row.product_link,
            codemark_link: row.codemark_link,
            branz_link: row.branz_link,
            certificate_notes: row.certificate_notes
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

  const startEditOption = (opt) => {
    setEditingOptionId(opt.id);
    setEditOptionForm({ ...opt });
  };

  const saveOptionEdit = async () => {
    if (!editingOptionId) return;

    const updateData = {
      label: editOptionForm.label,
      detail: editOptionForm.detail,
      warranty: editOptionForm.warranty,
      supplier: editOptionForm.supplier,
      product_link: editOptionForm.product_link,
      codemark_link: editOptionForm.codemark_link,
      branz_link: editOptionForm.branz_link,
      certificate_notes: editOptionForm.certificate_notes
    };

    const { error } = await supabase
      .from('sched_item_options')
      .update(updateData)
      .eq('id', editingOptionId);

    if (error) {
      alert('Save failed: ' + error.message);
    } else {
      alert('✅ Saved successfully!');
      setEditingOptionId(null);
      loadData();
    }
  };

  const deleteOption = async (id) => {
    if (!window.confirm('Delete this option?')) return;
    await supabase.from('sched_item_options').delete().eq('id', id);
    loadData();
  };

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
        <h2>Master Schedule — Full Edit</h2>
        <button onClick={loadData} style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: 8 }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div style={{ color: 'red', padding: '10px' }}>{error}</div>}

      {sections.map(section => (
        <div key={section.name} style={{ marginBottom: '40px' }}>
          <h3>{section.name}</h3>
          {section.items.map(item => (
            <div key={item.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
              <strong>{item.label}</strong> {item.cbi_code && `(CBI: ${item.cbi_code})`}

              {item.options.map(opt => (
                <div key={opt.id} style={{ padding: '12px', background: '#f8fafc', marginTop: '10px', borderRadius: '6px' }}>
                  {editingOptionId === opt.id ? (
                    <div>
                      <input value={editOptionForm.label || ''} onChange={e => setEditOptionForm({...editOptionForm, label: e.target.value})} placeholder="Label" style={{width:'100%', marginBottom:'8px'}} />
                      <textarea value={editOptionForm.detail || ''} onChange={e => setEditOptionForm({...editOptionForm, detail: e.target.value})} placeholder="Detail" style={{width:'100%', marginBottom:'8px'}} />
                      <input value={editOptionForm.supplier || ''} onChange={e => setEditOptionForm({...editOptionForm, supplier: e.target.value})} placeholder="Supplier" style={{width:'100%', marginBottom:'8px'}} />
                      <input value={editOptionForm.warranty || ''} onChange={e => setEditOptionForm({...editOptionForm, warranty: e.target.value})} placeholder="Warranty" style={{width:'100%', marginBottom:'8px'}} />
                      <input value={editOptionForm.product_link || ''} onChange={e => setEditOptionForm({...editOptionForm, product_link: e.target.value})} placeholder="Product Link (https://)" style={{width:'100%', marginBottom:'8px'}} />
                      <input value={editOptionForm.codemark_link || ''} onChange={e => setEditOptionForm({...editOptionForm, codemark_link: e.target.value})} placeholder="CodeMark Link" style={{width:'100%', marginBottom:'8px'}} />
                      <input value={editOptionForm.branz_link || ''} onChange={e => setEditOptionForm({...editOptionForm, branz_link: e.target.value})} placeholder="BRANZ Link" style={{width:'100%', marginBottom:'8px'}} />
                      <textarea value={editOptionForm.certificate_notes || ''} onChange={e => setEditOptionForm({...editOptionForm, certificate_notes: e.target.value})} placeholder="Certificate Notes" style={{width:'100%'}} />
                      <div style={{marginTop:'12px'}}>
                        <button onClick={saveOptionEdit} style={{background:'#166534', color:'white', padding:'8px 16px', marginRight:'8px'}}>Save</button>
                        <button onClick={() => setEditingOptionId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{fontWeight:500}}>{opt.label}</div>
                      {opt.detail && <div>{opt.detail}</div>}
                      {opt.supplier && <div>Supplier: {opt.supplier}</div>}
                      {opt.warranty && <div>Warranty: {opt.warranty}</div>}
                      {opt.product_link && <div>Product Link: <a href={opt.product_link} target="_blank">Open</a></div>}
                      <button onClick={() => startEdit(opt)} style={{marginRight:'8px'}}><Edit2 size={16}/></button>
                      <button onClick={() => deleteOption(opt.id)} style={{color:'red'}}><Trash2 size={16}/></button>
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
