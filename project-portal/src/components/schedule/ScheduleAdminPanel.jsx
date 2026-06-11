// ============================================================
// ScheduleAdminPanel.jsx
// Admin-only panel for adding/editing/deleting item options
// and linking CodeMark / BRANZ / manual documents.
// Only rendered when userRole === 'admin'
// ============================================================

import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Edit2, Save, X, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ScheduleAdminPanel() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editing states
  const [editingOptionId, setEditingOptionId] = useState(null);
  const [editOptionForm, setEditOptionForm] = useState({});

  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemForm, setEditItemForm] = useState({});

  const [addingToSection, setAddingToSection] = useState(null);
  const [newItemForm, setNewItemForm] = useState({ label: '', cbi_code: '' });

  const [addingOptionToItem, setAddingOptionToItem] = useState(null);
  const [newOptionForm, setNewOptionForm] = useState({ label: '', detail: '', warranty: '', supplier: '', model_ref: '' });

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
          section = { name: row.section, id: row.section_id, items: [] };
          acc.push(section);
        }

        let item = section.items.find(i => i.label === row.item);
        if (!item) {
          item = { 
            id: row.item_id,
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
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // === Item (Category) Editing ===
  const startEditItem = (item) => {
    setEditingItemId(item.id);
    setEditItemForm({ label: item.label, cbi_code: item.cbi_code });
  };

  const saveItemEdit = async (sectionId) => {
    const { error } = await supabase
      .from('sched_items')
      .update({ 
        label: editItemForm.label, 
        cbi_code: editItemForm.cbi_code 
      })
      .eq('id', editingItemId);

    if (error) alert('Failed to update category');
    else {
      setEditingItemId(null);
      loadData();
    }
  };

  const addNewItem = async (sectionId) => {
    if (!newItemForm.label.trim()) {
      alert("Category name is required");
      return;
    }

    const { error } = await supabase
      .from('sched_items')
      .insert({
        section_id: sectionId,
        label: newItemForm.label,
        cbi_code: newItemForm.cbi_code,
        sort_order: 999
      });

    if (error) alert('Failed to add category');
    else {
      setAddingToSection(null);
      setNewItemForm({ label: '', cbi_code: '' });
      loadData();
    }
  };

  // === Option Editing ===
  const startEditOption = (opt) => {
    setEditingOptionId(opt.id);
    setEditOptionForm({ ...opt });
  };

  const saveOptionEdit = async () => {
    const { error } = await supabase
      .from('sched_item_options')
      .update({
        label: editOptionForm.label,
        detail: editOptionForm.detail,
        warranty: editOptionForm.warranty,
        supplier: editOptionForm.supplier,
        model_ref: editOptionForm.model_ref
      })
      .eq('id', editingOptionId);

    if (error) alert('Save failed');
    else {
      setEditingOptionId(null);
      loadData();
    }
  };

  const addNewOption = async (itemId) => {
    if (!newOptionForm.label.trim()) {
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
        model_ref: newOptionForm.model_ref
      });

    if (error) alert('Failed to add option');
    else {
      setAddingOptionToItem(null);
      setNewOptionForm({ label: '', detail: '', warranty: '', supplier: '', model_ref: '' });
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
              {/* Item / Category Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                {editingItemId === item.id ? (
                  <div style={{ flex: 1 }}>
                    <input 
                      value={editItemForm.label} 
                      onChange={e => setEditItemForm({...editItemForm, label: e.target.value})} 
                      style={{ fontSize: '18px', fontWeight: 'bold', width: '70%', marginRight: '12px' }}
                    />
                    <input 
                      value={editItemForm.cbi_code} 
                      onChange={e => setEditItemForm({...editItemForm, cbi_code: e.target.value})} 
                      placeholder="CBI Code" 
                      style={{ width: '120px' }}
                    />
                    <button onClick={() => saveItemEdit(section.id)} style={{ marginLeft: '12px', background: '#166534', color: 'white', padding: '4px 12px', borderRadius: '6px' }}>Save</button>
                    <button onClick={() => setEditingItemId(null)} style={{ marginLeft: '8px' }}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <div>
                      <strong>{item.label}</strong>
                      {item.cbi_code && <span style={{ marginLeft: '12px', color: '#64748b' }}>CBI: {item.cbi_code}</span>}
                    </div>
                    <button onClick={() => startEditItem(item)} style={{ color: '#3b82f6' }}>
                      <Edit2 size={18} />
                    </button>
                  </>
                )}
              </div>

              {/* Options */}
              {item.options.map(opt => (
                <div key={opt.id} style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', marginBottom: '12px' }}>
                  {editingOptionId === opt.id ? (
                    /* Option Edit Form */
                    <div>
                      <label>Option Label</label>
                      <input value={editOptionForm.label || ''} onChange={e => setEditOptionForm({...editOptionForm, label: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'8px'}} />
                      <label>Detail / Specification</label>
                      <textarea value={editOptionForm.detail || ''} onChange={e => setEditOptionForm({...editOptionForm, detail: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'8px', minHeight:'70px'}} />
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                        <div><label>Supplier</label><input value={editOptionForm.supplier || ''} onChange={e => setEditOptionForm({...editOptionForm, supplier: e.target.value})} style={{width:'100%', padding:'8px'}} /></div>
                        <div><label>Warranty</label><input value={editOptionForm.warranty || ''} onChange={e => setEditOptionForm({...editOptionForm, warranty: e.target.value})} style={{width:'100%', padding:'8px'}} /></div>
                      </div>
                      <div style={{marginTop:'12px'}}>
                        <button onClick={saveOptionEdit} style={{background:'#166534', color:'white', padding:'6px 16px', borderRadius:'6px', marginRight:'8px'}}>Save</button>
                        <button onClick={() => setEditingOptionId(null)}>Cancel</button>
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
                        <button onClick={() => startEditOption(opt)} style={{color:'#3b82f6', marginRight:'12px'}}><Edit2 size={18}/></button>
                        <button onClick={() => deleteOption(opt.id)} style={{color:'#ef4444'}}><Trash2 size={18}/></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add New Option */}
              <button onClick={() => setAddingOptionToItem(item.id)} style={{ color: '#7c3aed', border: '1px dashed #c4b5fd', padding: '8px 16px', borderRadius: '8px', background: 'none', marginTop: '8px' }}>
                <Plus size={16} style={{marginRight:6}} /> Add New Option
              </button>

              {addingOptionToItem === item.id && (
                <div style={{ marginTop: '16px', padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
                  <h4>New Option for {item.label}</h4>
                  <label>Option Label</label>
                  <input value={newOptionForm.label} onChange={e => setNewOptionForm({...newOptionForm, label: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'8px'}} />
                  <label>Detail</label>
                  <textarea value={newOptionForm.detail} onChange={e => setNewOptionForm({...newOptionForm, detail: e.target.value})} style={{width:'100%', padding:'8px', marginBottom:'8px', minHeight:'60px'}} />
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                    <div><label>Supplier</label><input value={newOptionForm.supplier} onChange={e => setNewOptionForm({...newOptionForm, supplier: e.target.value})} style={{width:'100%', padding:'8px'}} /></div>
                    <div><label>Warranty</label><input value={newOptionForm.warranty} onChange={e => setNewOptionForm({...newOptionForm, warranty: e.target.value})} style={{width:'100%', padding:'8px'}} /></div>
                  </div>
                  <div style={{marginTop:'12px'}}>
                    <button onClick={() => addNewOption(item.id)} style={{background:'#166534', color:'white', padding:'8px 20px', borderRadius:'6px', marginRight:'8px'}}>Add Option</button>
                    <button onClick={() => {setAddingOptionToItem(null); setNewOptionForm({label:'',detail:'',warranty:'',supplier:'',model_ref:''});}}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add New Category / Item */}
          <button onClick={() => setAddingToSection(section.id)} style={{ color: '#7c3aed', border: '1px dashed #c4b5fd', padding: '10px 20px', borderRadius: '8px', background: 'none' }}>
            <Plus size={16} style={{marginRight:6}} /> Add New Category / Item
          </button>

          {addingToSection === section.id && (
            <div style={{ marginTop: '16px', padding: '20px', background: '#f0f9ff', borderRadius: '8px' }}>
              <h4>New Category in {section.name}</h4>
              <input value={newItemForm.label} onChange={e => setNewItemForm({...newItemForm, label: e.target.value})} placeholder="Category Name (e.g. Aluminium Windows)" style={{width:'100%', padding:'10px', marginBottom:'8px'}} />
              <input value={newItemForm.cbi_code} onChange={e => setNewItemForm({...newItemForm, cbi_code: e.target.value})} placeholder="CBI Code (e.g. 4521)" style={{width:'100%', padding:'10px', marginBottom:'12px'}} />
              <button onClick={() => addNewItem(section.id)} style={{background:'#166534', color:'white', padding:'8px 20px', borderRadius:'6px', marginRight:'8px'}}>Add Category</button>
              <button onClick={() => {setAddingToSection(null); setNewItemForm({label:'', cbi_code:''});}}>Cancel</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
