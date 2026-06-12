import React, { useState, useEffect } from 'react';
import { RefreshCw, Edit2, X, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ScheduleAdminPanel({ activeTab = 'options' }) {
  const [data, setData] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sortBy, setSortBy] = useState('name');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const { data: secs } = await supabase.from('sched_sections').select('*').order('sort_order');
      setSectionsList(secs || []);

      const { data: prods } = await supabase.from('sched_item_options').select('*').order('label');
      setProductsList(prods || []);

      if (activeTab === 'options') {
        const { data: rows } = await supabase.from('v_sched_master').select('*').order('section_order, item_order');
        setData(rows || []);
      }
      if (activeTab === 'items') {
        const { data: rows } = await supabase
          .from('sched_items')
          .select('*, sched_sections(name), sched_item_options(id, label)')
          .order('sort_order');
        setData(rows || []);
      }
      if (activeTab === 'sections') {
        const { data: rows } = await supabase
          .from('sched_sections')
          .select('*, sched_items(id, label, cbi_code)')
          .order('sort_order');
        setData(rows || []);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // ==================== OPEN ADD / EDIT MODAL ====================
  const openAddModal = (type) => {
    setIsCreating(true);
    setEditingId(null);
    
    if (type === 'product') {
      setEditForm({ type: 'product', label: '', detail: '', product_link: '', branz_link: '', codemark_link: '', certificate_notes: '' });
    } else if (type === 'item') {
      setEditForm({ type: 'item', label: '', section_id: sectionsList[0]?.id || '', cbi_code: '' });
    } else if (type === 'section') {
      setEditForm({ type: 'section', name: '' });
    }
  };

  const startEdit = (item, type) => {
    setIsCreating(false);
    setEditingId(item.id || item.option_id);
    if (type === 'product') {
      setEditForm({ ...item, type: 'product' });
    } else if (type === 'item') {
      setEditForm({ ...item, type: 'item' });
    } else if (type === 'section') {
      setEditForm({ ...item, type: 'section' });
    }
  };

  // ==================== SAVE (CREATE or UPDATE) ====================
  const saveEdit = async () => {
    try {
      if (editForm.type === 'product') {
        if (isCreating) {
          await supabase.from('sched_item_options').insert(editForm);
        } else {
          await supabase.from('sched_item_options').update(editForm).eq('id', editingId);
        }
      } else if (editForm.type === 'item') {
        const itemData = {
          label: editForm.label,
          section_id: editForm.section_id,
          cbi_code: editForm.cbi_code || null
        };
        if (isCreating) {
          await supabase.from('sched_items').insert(itemData);
        } else {
          await supabase.from('sched_items').update(itemData).eq('id', editingId);
        }
      } else if (editForm.type === 'section') {
        if (isCreating) {
          await supabase.from('sched_sections').insert({ name: editForm.name });
        } else {
          await supabase.from('sched_sections').update({ name: editForm.name }).eq('id', editingId);
        }
      }
      setEditingId(null);
      setIsCreating(false);
      loadData();
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setEditForm({});
  };

  // ==================== DELETE ====================
  const deleteItem = async (id, table) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      await supabase.from(table).delete().eq('id', id);
      loadData();
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  };

  // ==================== ASSIGN / UNASSIGN PRODUCT ====================
  const assignProductToItem = async (itemId, productId) => {
    try {
      await supabase.from('sched_item_options').update({ item_id: itemId }).eq('id', productId);
      loadData();
    } catch (e) {
      alert('Failed to assign: ' + e.message);
    }
  };

  const unassignProduct = async (productId) => {
    try {
      await supabase.from('sched_item_options').update({ item_id: null }).eq('id', productId);
      loadData();
    } catch (e) {
      alert('Failed to unassign: ' + e.message);
    }
  };

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}>Loading...</div>;

  const sortedData = activeTab === 'options' 
    ? [...data].sort((a, b) => sortBy === 'name' 
        ? (a.option_label || '').localeCompare(b.option_label || '') 
        : (a.cbi_code || '').localeCompare(b.cbi_code || ''))
    : data;

  return (
    <div>
      {/* OPTIONS & PRODUCTS TAB */}
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

          {sortedData.map((row, index) => (
            <div key={index} style={{ padding: '16px 20px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '12px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                <button onClick={() => startEdit(row, 'product')}><Edit2 size={18} /></button>
                <button onClick={() => deleteItem(row.option_id, 'sched_item_options')}><Trash2 size={18} color="#ef4444" /></button>
              </div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>{row.option_label}</div>
              {row.detail && <div style={{ fontSize: '14px', marginTop: '6px' }}>{row.detail}</div>}
              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '13px', color: '#64748b' }}>
                {row.section} → {row.item}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ITEMS TAB */}
      {activeTab === 'items' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => openAddModal('item')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#166534', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '500' }}>
              <Plus size={16} /> Add New Item
            </button>
          </div>

          {data.map(item => (
            <div key={item.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <strong>{item.label}</strong> {item.cbi_code && <span style={{ color: '#64748b' }}>(CBI: {item.cbi_code})</span>}
                  <div style={{ fontSize: '13px', color: '#666' }}>{item.sched_sections?.name}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => startEdit(item, 'item')}><Edit2 size={18} /></button>
                  <button onClick={() => deleteItem(item.id, 'sched_items')}><Trash2 size={18} color="#ef4444" /></button>
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '14px' }}>Assigned Products:</strong>
                {item.sched_item_options?.length > 0 ? (
                  <ul style={{ marginTop: '8px' }}>
                    {item.sched_item_options.map(opt => (
                      <li key={opt.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        {opt.label}
                        <button onClick={() => unassignProduct(opt.id)} style={{ color: '#ef4444', background: 'none', border: 'none' }}>Remove</button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: '13px' }}>No products assigned</div>
                )}
              </div>

              <div style={{ marginTop: '12px' }}>
                <select onChange={(e) => { if (e.target.value) assignProductToItem(item.id, e.target.value); e.target.value = ''; }} style={{ padding: '8px', width: '100%' }}>
                  <option value="">+ Assign a product to this item</option>
                  {productsList.filter(p => !item.sched_item_options?.some(op => op.id === p.id)).map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </>
      )}

      {/* SECTIONS TAB */}
      {activeTab === 'sections' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => openAddModal('section')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#166534', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '500' }}>
              <Plus size={16} /> Add New Section
            </button>
          </div>

          {data.map(sec => (
            <div key={sec.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '17px' }}>{sec.name}</strong>
                <div>
                  <button onClick={() => startEdit(sec, 'section')}><Edit2 size={18} /></button>
                  <button onClick={() => deleteItem(sec.id, 'sched_sections')}><Trash2 size={18} color="#ef4444" /></button>
                </div>
              </div>

              <div style={{ marginTop: '10px', fontSize: '14px' }}>
                <strong>Elements:</strong>
                {sec.sched_items?.length > 0 ? (
                  <ul style={{ marginTop: '6px', paddingLeft: '20px' }}>
                    {sec.sched_items.map(el => <li key={el.id}>{el.label}</li>)}
                  </ul>
                ) : <span style={{ color: '#94a3b8' }}> No elements</span>}
              </div>
            </div>
          ))}
        </>
      )}

      {/* EDIT / ADD MODAL */}
      { (editingId || isCreating) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '560px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{isCreating ? 'Add New' : 'Edit'}</h3>
              <button onClick={cancelEdit} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer' }}><X size={22} /></button>
            </div>

            {/* Form fields (same as before) */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>Name / Label</label>
              <input value={editForm.label || editForm.name || ''} onChange={e => setEditForm({ ...editForm, label: e.target.value, name: e.target.value })} placeholder="Enter name" style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
            </div>

            {editForm.type === 'product' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>Description / Details</label>
                  <textarea value={editForm.detail || ''} onChange={e => setEditForm({ ...editForm, detail: e.target.value })} placeholder="Enter description" style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', minHeight: '80px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>Product Page / Website Link</label>
                  <input value={editForm.product_link || ''} onChange={e => setEditForm({ ...editForm, product_link: e.target.value })} placeholder="https://..." style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>BRANZ Appraisal Link</label>
                  <input value={editForm.branz_link || ''} onChange={e => setEditForm({ ...editForm, branz_link: e.target.value })} placeholder="https://branz..." style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>CodeMark Certificate Link</label>
                  <input value={editForm.codemark_link || ''} onChange={e => setEditForm({ ...editForm, codemark_link: e.target.value })} placeholder="https://codem..." style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>Installation Manual Link</label>
                  <input value={editForm.certificate_notes || ''} onChange={e => setEditForm({ ...editForm, certificate_notes: e.target.value })} placeholder="Link to manual" style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                </div>
              </>
            )}

            {editForm.type === 'item' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>Category / Section</label>
                  <select value={editForm.section_id || ''} onChange={e => setEditForm({ ...editForm, section_id: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                    {sectionsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#444', marginBottom: '6px' }}>CBI Reference Code</label>
                  <input value={editForm.cbi_code || ''} onChange={e => setEditForm({ ...editForm, cbi_code: e.target.value })} placeholder="e.g. 4221" style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                </div>
              </>
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
