import React, { useState, useEffect } from 'react';
import { Edit2, X, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ScheduleAdminPanel({ activeTab = 'options' }) {
  const [data, setData] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [assignedItems, setAssignedItems] = useState([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === 'options') {
        const { data: rows } = await supabase.from('v_sched_master').select('*').order('section_order, item_order');
        setData(rows || []);
      } else if (activeTab === 'items') {
        const { data: items } = await supabase.from('sched_items').select('*, sched_sections(name)').order('sort_order');
        setData(items || []);
      } else if (activeTab === 'sections') {
        const { data: secs } = await supabase.from('sched_sections').select('*').order('sort_order');
        setData(secs || []);
      } else {
        setData([]);
      }

      const { data: items } = await supabase.from('sched_items').select('id, label, cbi_code').order('sort_order');
      setItemsList(items || []);

      const { data: secs } = await supabase.from('sched_sections').select('*').order('sort_order');
      setSectionsList(secs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadAssignedItems(optionId) {
    const { data } = await supabase
      .from('sched_item_option_assignments')
      .select('item_id, sched_items(id, label, cbi_code)')
      .eq('option_id', optionId);
    setAssignedItems(data || []);
  }

  const openAddModal = () => {
    setIsCreating(true);
    setEditingId(null);
    setAssignedItems([]);

    if (activeTab === 'options') {
      setEditForm({ label: '', detail: '', product_link: '', branz_link: '', codemark_link: '', certificate_notes: '' });
    } else if (activeTab === 'items') {
      setEditForm({ label: '', cbi_code: '', section_id: sectionsList[0]?.id || '' });
    } else if (activeTab === 'sections') {
      setEditForm({ name: '' });
    }
  };

  const startEdit = async (row) => {
    setIsCreating(false);
    setEditingId(row.id || row.option_id);

    if (activeTab === 'options') {
      setEditForm({
        label: row.option_label || row.label || '',
        detail: row.detail || '',
        product_link: row.product_link || '',
        branz_link: row.branz_link || '',
        codemark_link: row.codemark_link || '',
        certificate_notes: row.certificate_notes || ''
      });
      await loadAssignedItems(row.option_id);
    } else if (activeTab === 'items') {
      setEditForm({ ...row });
    } else if (activeTab === 'sections') {
      setEditForm({ ...row });
    }
  };

  const saveEdit = async () => {
    try {
      if (activeTab === 'options') {
        const productData = {
          label: editForm.label,
          detail: editForm.detail || null,
          product_link: editForm.product_link || null,
          branz_link: editForm.branz_link || null,
          codemark_link: editForm.codemark_link || null,
          certificate_notes: editForm.certificate_notes || null
        };

        let optionId = editingId;
        if (isCreating) {
          const { data: newOpt } = await supabase.from('sched_item_options').insert(productData).select().single();
          optionId = newOpt.id;
        } else {
          await supabase.from('sched_item_options').update(productData).eq('id', editingId);
        }

        if (optionId) {
          await supabase.from('sched_item_option_assignments').delete().eq('option_id', optionId);
          if (assignedItems.length > 0) {
            const assignments = assignedItems.map(a => ({ item_id: a.item_id, option_id: optionId }));
            await supabase.from('sched_item_option_assignments').insert(assignments);
          }
        }
      } else if (activeTab === 'items') {
        const itemData = {
          label: editForm.label,
          cbi_code: editForm.cbi_code || null,
          section_id: editForm.section_id
        };
        if (isCreating) {
          await supabase.from('sched_items').insert(itemData);
        } else {
          await supabase.from('sched_items').update(itemData).eq('id', editingId);
        }
      } else if (activeTab === 'sections') {
        if (isCreating) {
          await supabase.from('sched_sections').insert({ name: editForm.name });
        } else {
          await supabase.from('sched_sections').update({ name: editForm.name }).eq('id', editingId);
        }
      }

      setEditingId(null);
      setIsCreating(false);
      setAssignedItems([]);
      loadData();
    } catch (e) {
      console.error(e);
      alert('Save failed: ' + e.message);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setAssignedItems([]);
    setEditForm({});
  };

  const addItemToProduct = (itemId) => {
    const item = itemsList.find(i => i.id === itemId);
    if (item && !assignedItems.some(a => a.item_id === itemId)) {
      setAssignedItems([...assignedItems, { item_id: itemId, sched_items: item }]);
    }
  };

  const removeItemFromProduct = (itemId) => {
    setAssignedItems(assignedItems.filter(a => a.item_id !== itemId));
  };

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}>Loading...</div>;

  if (activeTab !== 'options') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
          <button onClick={openAddModal} style={{ padding: '8px 16px', background: '#166534', color: 'white', border: 'none', borderRadius: '8px' }}>
            <Plus size={16} /> Add New
          </button>
        </div>

        {data.map((row, index) => (
          <div key={index} style={{ padding: '18px 22px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '14px', position: 'relative', background: '#fff' }}>
            <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
              <button onClick={() => startEdit(row)}><Edit2 size={18} /></button>
              <button onClick={() => {}}><Trash2 size={18} color="#ef4444" /></button>
            </div>
            <div style={{ fontWeight: '600' }}>{row.name || row.label}</div>
            {row.cbi_code && <div style={{ fontSize: '13px', color: '#666' }}>CBI: {row.cbi_code}</div>}
          </div>
        ))}
      </div>
    );
  }

  // Options & Products Tab
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Options & Products</h2>
        <button onClick={openAddModal} style={{ padding: '8px 16px', background: '#166534', color: 'white', border: 'none', borderRadius: '8px' }}>
          <Plus size={16} /> Add New Product
        </button>
      </div>

      {data.map((row, index) => (
        <div key={index} style={{ padding: '18px 22px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '14px', position: 'relative', background: '#fff' }}>
          <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
            <button onClick={() => startEdit(row)}><Edit2 size={18} /></button>
            <button onClick={() => {}}><Trash2 size={18} color="#ef4444" /></button>
          </div>

          <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '8px' }}>{row.option_label}</div>
          {row.detail && <div style={{ fontSize: '14px', color: '#475569', marginBottom: '12px' }}>{row.detail}</div>}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {row.product_link && <a href={row.product_link} target="_blank" rel="noopener noreferrer" style={{ color: '#1e40af', fontSize: '13px' }}>Product</a>}
            {row.branz_link && <a href={row.branz_link} target="_blank" rel="noopener noreferrer" style={{ color: '#1e40af', fontSize: '13px' }}>BRANZ</a>}
            {row.codemark_link && <a href={row.codemark_link} target="_blank" rel="noopener noreferrer" style={{ color: '#1e40af', fontSize: '13px' }}>CodeMark</a>}
          </div>
        </div>
      ))}

      {/* EDIT MODAL */}
      {(editingId || isCreating) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>{isCreating ? 'Add New' : 'Edit'} {activeTab === 'options' ? 'Product' : activeTab === 'items' ? 'Item' : 'Section'}</h3>
              <button onClick={cancelEdit}><X size={22} /></button>
            </div>

            {/* Options Tab */}
            {activeTab === 'options' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>Name / Label</label>
                  <input value={editForm.label || ''} onChange={e => setEditForm({ ...editForm, label: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>Assigned to Items</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    {assignedItems.map((a, idx) => (
                      <div key={idx} style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {a.sched_items?.label}
                        <button onClick={() => removeItemFromProduct(a.item_id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
                      </div>
                    ))}
                  </div>
                  <select onChange={(e) => { if (e.target.value) addItemToProduct(e.target.value); e.target.value = ''; }} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                    <option value="">+ Assign to Item</option>
                    {itemsList.filter(i => !assignedItems.some(a => a.item_id === i.id)).map(i => (
                      <option key={i.id} value={i.id}>{i.label} {i.cbi_code ? `(${i.cbi_code})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>Description / Details</label>
                  <textarea value={editForm.detail || ''} onChange={e => setEditForm({ ...editForm, detail: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', minHeight: '90px' }} />
                </div>
              </>
            )}

            {/* Items Tab */}
            {activeTab === 'items' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>Label</label>
                  <input value={editForm.label || ''} onChange={e => setEditForm({ ...editForm, label: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>CBI Code</label>
                  <input value={editForm.cbi_code || ''} onChange={e => setEditForm({ ...editForm, cbi_code: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>Section</label>
                  <select value={editForm.section_id || ''} onChange={e => setEditForm({ ...editForm, section_id: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                    {sectionsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Sections Tab */}
            {activeTab === 'sections' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>Section Name</label>
                <input value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
              </div>
            )}

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button onClick={saveEdit} style={{ background: '#166534', color: 'white', padding: '12px 28px', borderRadius: '8px', border: 'none', fontWeight: '500' }}>
                {isCreating ? 'Create' : 'Save Changes'}
              </button>
              <button onClick={cancelEdit} style={{ background: '#f3f4f6', color: '#374151', padding: '12px 28px', borderRadius: '8px', border: '1px solid #d1d5db' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
