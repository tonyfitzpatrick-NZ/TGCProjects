import React, { useState, useEffect } from 'react';
import { Edit2, X, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ScheduleAdminPanel({ activeTab = 'options' }) {
  const [data, setData] = useState([]);
  const [itemsList, setItemsList] = useState([]);
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
        const { data: rows } = await supabase
          .from('v_sched_master')
          .select(`
            *,
            sched_item_option_assignments (
              item_id,
              sched_items (id, label, cbi_code)
            )
          `)
          .order('section_order, item_order');
        setData(rows || []);
      } else {
        setData([]); // Other tabs will be empty for now
      }

      const { data: items } = await supabase
        .from('sched_items')
        .select('id, label, cbi_code')
        .order('sort_order');
      setItemsList(items || []);
    } catch (e) {
      console.error('Load error:', e);
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
    setEditForm({ label: '', detail: '', product_link: '', branz_link: '', codemark_link: '', certificate_notes: '' });
  };

  const startEdit = async (row) => {
    setIsCreating(false);
    setEditingId(row.option_id);
    setEditForm({
      label: row.option_label || row.label || '',
      detail: row.detail || '',
      product_link: row.product_link || '',
      branz_link: row.branz_link || '',
      codemark_link: row.codemark_link || '',
      certificate_notes: row.certificate_notes || ''
    });
    await loadAssignedItems(row.option_id);
  };

  const saveEdit = async () => {
    try {
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

  // Other tabs placeholder
  if (activeTab !== 'options') {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#666' }}>
        <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</h3>
        <p>Coming soon...</p>
      </div>
    );
  }

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

          {/* Assigned Items - Improved display */}
          {row.sched_item_option_assignments && row.sched_item_option_assignments.length > 0 && (
            <div style={{ fontSize: '13px', color: '#166534', marginBottom: '10px', fontWeight: '500' }}>
              Assigned to: {row.sched_item_option_assignments.map(a => a.sched_items?.label || 'Unknown Item').join(', ')}
            </div>
          )}

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
              <h3>{isCreating ? 'Add New Product' : 'Edit Product'}</h3>
              <button onClick={cancelEdit}><X size={22} /></button>
            </div>

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

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>Product Page / Website Link</label>
              <input value={editForm.product_link || ''} onChange={e => setEditForm({ ...editForm, product_link: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>BRANZ Appraisal Link</label>
              <input value={editForm.branz_link || ''} onChange={e => setEditForm({ ...editForm, branz_link: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>CodeMark Certificate Link</label>
              <input value={editForm.codemark_link || ''} onChange={e => setEditForm({ ...editForm, codemark_link: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>Installation Manual Link</label>
              <input value={editForm.certificate_notes || ''} onChange={e => setEditForm({ ...editForm, certificate_notes: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
            </div>

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
