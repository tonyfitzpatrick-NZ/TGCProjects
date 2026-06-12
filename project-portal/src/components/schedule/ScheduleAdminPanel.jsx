import React, { useState, useEffect } from 'react';
import { RefreshCw, Edit2, X, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ScheduleAdminPanel({ activeTab = 'options' }) {
  const [data, setData] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sortBy, setSortBy] = useState('name');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [assignedItems, setAssignedItems] = useState([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const { data: secs } = await supabase.from('sched_sections').select('*').order('sort_order');
      setSectionsList(secs || []);

      const { data: itemsData } = await supabase
        .from('sched_items')
        .select('id, label, cbi_code')
        .order('sort_order');
      setItemsList(itemsData || []);

      if (activeTab === 'options') {
        const { data: rows } = await supabase.from('v_sched_master').select('*').order('section_order, item_order');
        setData(rows || []);
      }
    } catch (e) {
      setError(e.message);
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

  const openAddModal = (type) => {
    setIsCreating(true);
    setEditingId(null);
    setAssignedItems([]);

    if (type === 'product') {
      setEditForm({ type: 'product', label: '', detail: '', product_link: '', branz_link: '', codemark_link: '', certificate_notes: '' });
    }
  };

  const startEdit = async (item, type) => {
    setIsCreating(false);
    setEditingId(item.id || item.option_id);

    if (type === 'product') {
      setEditForm({
        type: 'product',
        label: item.option_label || item.label || '',
        detail: item.detail || '',
        product_link: item.product_link || '',
        branz_link: item.branz_link || '',
        codemark_link: item.codemark_link || '',
        certificate_notes: item.certificate_notes || ''
      });
      await loadAssignedItems(item.id || item.option_id);
    }
  };

  const saveEdit = async () => {
    try {
      if (editForm.type === 'product') {
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
          const { data: newOption } = await supabase.from('sched_item_options').insert(productData).select().single();
          optionId = newOption.id;
        } else {
          await supabase.from('sched_item_options').update(productData).eq('id', editingId);
        }

        if (optionId) {
          await supabase.from('sched_item_option_assignments').delete().eq('option_id', optionId);
          if (assignedItems.length > 0) {
            const assignments = assignedItems.map(a => ({
              item_id: a.item_id,
              option_id: optionId
            }));
            await supabase.from('sched_item_option_assignments').insert(assignments);
          }
        }
      }

      setEditingId(null);
      setIsCreating(false);
      setAssignedItems([]);
      loadData();
    } catch (e) {
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

  const deleteItem = async (id, table) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      await supabase.from(table).delete().eq('id', id);
      loadData();
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      {activeTab === 'options' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <button onClick={() => setSortBy('name')} style={{ background: sortBy === 'name' ? '#1B2B4B' : '#f1f5f9', color: sortBy === 'name' ? 'white' : 'black', padding: '6px 14px', borderRadius: '6px', marginRight: '8px' }}>
                Sort by Name
              </button>
              <button onClick={() => setSortBy('cbi')} style={{ background: sortBy === 'cbi' ? '#1B2B4B' : '#f1f5f9', color: sortBy === 'cbi' ? 'white' : 'black', padding: '6px 14px', borderRadius: '6px' }}>
                Sort by CBI
              </button>
            </div>
            <button onClick={() => openAddModal('product')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#166534', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '500' }}>
              <Plus size={16} /> Add New Product
            </button>
          </div>

          {data.map((row, index) => (
            <div key={index} style={{ padding: '18px 22px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '14px', position: 'relative', background: '#fff' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                <button onClick={() => startEdit(row, 'product')}><Edit2 size={18} /></button>
                <button onClick={() => deleteItem(row.option_id, 'sched_item_options')}><Trash2 size={18} color="#ef4444" /></button>
              </div>

              <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '8px' }}>{row.option_label}</div>
              {row.detail && <div style={{ fontSize: '14px', color: '#475569', marginBottom: '12px' }}>{row.detail}</div>}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {row.product_link && <a href={row.product_link} target="_blank" rel="noopener noreferrer" style={{ color: '#1e40af', fontSize: '13px', textDecoration: 'none' }}><ExternalLink size={14} /> Product</a>}
                {row.branz_link && <a href={row.branz_link} target="_blank" rel="noopener noreferrer" style={{ color: '#1e40af', fontSize: '13px', textDecoration: 'none' }}><Award size={14} /> BRANZ</a>}
                {row.codemark_link && <a href={row.codemark_link} target="_blank" rel="noopener noreferrer" style={{ color: '#1e40af', fontSize: '13px', textDecoration: 'none' }}><Shield size={14} /> CodeMark</a>}
              </div>
            </div>
          ))}
        </>
      )}

      {/* EDIT MODAL */}
      {(editingId || isCreating) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
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
