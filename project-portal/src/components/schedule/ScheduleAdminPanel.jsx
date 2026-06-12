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

  // ==================== EDIT ====================
  const startEdit = (item, type) => {
    setEditingId(item.id || item.option_id);
    if (type === 'product') {
      setEditForm({ ...item, type: 'product' });
    } else if (type === 'item') {
      setEditForm({ ...item, type: 'item' });
    } else if (type === 'section') {
      setEditForm({ ...item, type: 'section' });
    }
  };

  const saveEdit = async () => {
    try {
      if (editForm.type === 'product') {
        await supabase.from('sched_item_options').update(editForm).eq('id', editingId);
      } else if (editForm.type === 'item') {
        await supabase.from('sched_items').update(editForm).eq('id', editingId);
      } else if (editForm.type === 'section') {
        await supabase.from('sched_sections').update(editForm).eq('id', editingId);
      }
      setEditingId(null);
      loadData();
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
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

  // ==================== ASSIGN PRODUCT TO ITEM ====================
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

  return (
    <div>
      {/* OPTIONS & PRODUCTS TAB */}
      {activeTab === 'options' && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <button onClick={() => setSortBy('name')} style={{ background: sortBy === 'name' ? '#1B2B4B' : '#f1f5f9', color: sortBy === 'name' ? 'white' : 'black', padding: '6px 14px', borderRadius: '6px', marginRight: '8px' }}>
              Sort by Name
            </button>
            <button onClick={() => setSortBy('cbi')} style={{ background: sortBy === 'cbi' ? '#1B2B4B' : '#f1f5f9', color: sortBy === 'cbi' ? 'white' : 'black', padding: '6px 14px', borderRadius: '6px' }}>
              Sort by CBI
            </button>
          </div>

          {data.map((row, index) => (
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

      {/* ITEMS TAB - With Product Assignment */}
      {activeTab === 'items' && (
        <div>
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

              {/* Assigned Products */}
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

              {/* Assign new product */}
              <div style={{ marginTop: '12px' }}>
                <select 
                  onChange={(e) => {
                    if (e.target.value) assignProductToItem(item.id, e.target.value);
                    e.target.value = '';
                  }}
                  style={{ padding: '8px', width: '100%' }}
                >
                  <option value="">+ Assign a product to this item</option>
                  {productsList
                    .filter(p => !item.sched_item_options?.some(op => op.id === p.id))
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTIONS TAB */}
      {activeTab === 'sections' && (
        <div>
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
        </div>
      )}

      {/* EDIT MODAL */}
      {editingId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Edit</h3>
              <button onClick={cancelEdit}><X size={20} /></button>
            </div>

            <input value={editForm.label || editForm.name || ''} onChange={e => setEditForm({ ...editForm, label: e.target.value, name: e.target.value })} placeholder="Name" style={{ width: '100%', marginBottom: '12px' }} />

            {editForm.type === 'item' && (
              <div style={{ marginBottom: '12px' }}>
                <label>Category</label>
                <select value={editForm.section_id || ''} onChange={e => setEditForm({ ...editForm, section_id: e.target.value })} style={{ width: '100%', padding: '10px' }}>
                  {sectionsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {editForm.type === 'product' && (
              <>
                <textarea value={editForm.detail || ''} onChange={e => setEditForm({ ...editForm, detail: e.target.value })} placeholder="Description" style={{ width: '100%', marginBottom: '12px' }} />
                <input value={editForm.product_link || ''} onChange={e => setEditForm({ ...editForm, product_link: e.target.value })} placeholder="Product Link" style={{ width: '100%', marginBottom: '8px' }} />
              </>
            )}

            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button onClick={saveEdit} style={{ background: '#166534', color: 'white', padding: '10px 24px', borderRadius: '8px' }}>Save</button>
              <button onClick={cancelEdit}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
