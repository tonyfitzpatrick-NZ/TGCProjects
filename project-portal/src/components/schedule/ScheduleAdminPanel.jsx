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
          item = { 
            id: row.item_id, 
            label: row.item || 'Unknown', 
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
            model_ref: row.model_ref,
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
      console.error(e);
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
    const { error } = await supabase
      .from('sched_item_options')
      .update({
        label: editOptionForm.label,
        detail: editOptionForm.detail,
        warranty: editOptionForm.warranty,
        supplier: editOptionForm.supplier,
        model_ref: editOptionForm.model_ref,
        product_link: editOptionForm.product_link,
        codemark_link: editOptionForm.codemark_link,
        branz_link: editOptionForm.branz_link,
        certificate_notes: editOptionForm.certificate_notes
      })
      .eq('id', editingOptionId);

    if (error) {
      alert('Save failed: ' + error.message);
    } else {
      setEditingOptionId(null);
      setEditOptionForm({});
      loadData();
    }
  };

  const addNewOption = async (itemId) => {
    if (!newOptionForm.label?.trim()) {
      alert("Option label is required");
      return;
    }

    const { error } = await supabase
      .from('sched_item_options')
      .insert({
        item_id: itemId,
        label: newOptionForm.label,
        detail: newOptionForm.detail,
        warranty: newOptionForm.warranty,
        supplier: newOptionForm.supplier,
        model_ref: newOptionForm.model_ref,
        product_link: newOptionForm.product_link,
        codemark_link: newOptionForm.codemark_link,
        branz_link: newOptionForm.branz_link,
        certificate_notes: newOptionForm.certificate_notes
      });

    if (error) {
      alert('Failed to add option: ' + error.message);
    } else {
      setAddingOptionToItem(null);
      setNewOptionForm({ label: '', detail: '', warranty: '', supplier: '', model_ref: '', product_link: '', codemark_link: '', branz_link: '', certificate_notes: '' });
      loadData();
    }
  };

  const deleteOption = async (id) => {
    if (!window.confirm('Delete this option?')) return;
    const { error } = await supabase.from('sched_item_options').delete().eq('id', id);
    if (error) alert('Delete failed');
    else loadData();
  };

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}>Loading master schedule...</div>;

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
        <h2>Master Schedule — Full Edit</h2>
        <button onClick={loadData} style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: 8 }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div style={{ padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

      {sections.map(section => (
        <div key={section.name} style={{ marginBottom: '48px' }}>
          <h3 style={{ fontSize: '22px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            {section.name}
          </h3>

          {section.items.map(item => (
            <div key={item.id} style={{ 
              background: '#fff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px', 
              padding: '20px', 
              marginBottom: '24px' 
            }}>
              <strong>{item.label}</strong> {item.cbi_code && <span style={{ marginLeft: '12px', color: '#64748b' }}>CBI: {item.cbi_code}</span>}

              {item.options.map(opt => (
                <div key={opt.id} style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', marginBottom: '12px' }}>
                  {editingOptionId === opt.id ? (
                    <div>
                      <label>Option Label</label>
                      <input value={editOptionForm.label || ''} onChange={e => setEditOptionForm({...editOptionForm, label: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'8px'}} />

                      <label>Detail</label>
                      <textarea value={editOptionForm.detail || ''} onChange={e => setEditOptionForm({...editOptionForm, detail: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'8px', minHeight:'60px'}} />

                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px'}}>
                        <div><label>Supplier</label><input value={editOptionForm.supplier || ''} onChange={e => setEditOptionForm({...editOptionForm, supplier: e.target.value})} style={{width:'100%', padding:'8px'}} /></div>
                        <div><label>Warranty</label><input value={editOptionForm.warranty || ''} onChange={e => setEditOptionForm({...editOptionForm, warranty: e.target.value})} style={{width:'100%', padding:'8px'}} /></div>
                      </div>

                      <label>Product Link</label>
                      <input value={editOptionForm.product_link || ''} onChange={e => setEditOptionForm({...editOptionForm, product_link: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'8px'}} placeholder="https://" />

                      <label>CodeMark Link</label>
                      <input value={editOptionForm.codemark_link || ''} onChange={e => setEditOptionForm({...editOptionForm, codemark_link: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'8px'}} placeholder="https://" />

                      <label>BRANZ Link</label>
                      <input value={editOptionForm.branz_link || ''} onChange={e => setEditOptionForm({...editOptionForm, branz_link: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'8px'}} placeholder="https://" />

                      <label>Certificate Notes</label>
                      <textarea value={editOptionForm.certificate_notes || ''} onChange={e => setEditOptionForm({...editOptionForm, certificate_notes: e.target.value})} style={{width:'100%', padding:'8px', minHeight:'60px'}} />

                      <div style={{marginTop:'16px'}}>
                        <button onClick={saveOptionEdit} style={{background:'#166534', color:'white', padding:'8px 20px', borderRadius:'6px', marginRight:'8px'}}>Save Changes</button>
                        <button onClick={() => setEditingOptionId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
                      <div>
                        <div style={{fontWeight:500}}>{opt.label}</div>
                        {opt.detail && <div style={{fontSize:'13px'}}>{opt.detail}</div>}
                        {opt.supplier && <div>Supplier: {opt.supplier}</div>}
                        {opt.warranty && <div>Warranty: {opt.warranty}</div>}
                      </div>
                      <div>
                        <button onClick={() => startEditOption(opt)} style={{color:'#3b82f6', marginRight:'12px'}}><Edit2 size={18}/></button>
                        <button onClick={() => deleteOption(opt.id)} style={{color:'#ef4444'}}><Trash2 size={18}/></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button onClick={() => setAddingOptionToItem(item.id)} style={{ color: '#7c3aed', border: '1px dashed #c4b5fd', padding: '8px 16px', borderRadius: '8px', background: 'none', marginTop: '8px' }}>
                <Plus size={16} style={{marginRight:6}} /> Add New Option
              </button>

              {addingOptionToItem === item.id && (
                <div style={{ marginTop: '16px', padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
                  <h4>New Option for {item.label}</h4>
                  {/* Same form as edit */}
                  <label>Option Label *</label>
                  <input value={newOptionForm.label} onChange={e => setNewOptionForm({...newOptionForm, label: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'8px'}} />
                  {/* ... other fields same as above ... */}
                  <div style={{marginTop:'12px'}}>
                    <button onClick={() => addNewOption(item.id)} style={{background:'#166534', color:'white', padding:'8px 20px', borderRadius:'6px', marginRight:'8px'}}>Add Option</button>
                    <button onClick={() => {setAddingOptionToItem(null); setNewOptionForm({label:'', detail:'', warranty:'', supplier:'', model_ref:'', product_link:'', codemark_link:'', branz_link:'', certificate_notes:''});}}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
