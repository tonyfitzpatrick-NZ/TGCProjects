import React, { useState, useEffect } from 'react';
import { RefreshCw, Edit2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ScheduleAdminPanel({ activeTab = 'options' }) {
  const [data, setData] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
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

  const getSortedOptions = () => {
    if (activeTab !== 'options') return data;
    return [...data].sort((a, b) => {
      if (sortBy === 'name') return (a.option_label || '').localeCompare(b.option_label || '');
      if (sortBy === 'cbi') return (a.cbi_code || '').localeCompare(b.cbi_code || '');
      return 0;
    });
  };

  const startEdit = (item, type) => {
    setEditingId(item.id || item.option_id);
    if (type === 'product') {
      setEditForm({
        label: item.option_label,
        detail: item.detail,
        warranty: item.warranty,
        supplier: item.supplier,
        product_link: item.product_link,
        codemark_link: item.codemark_link,
        branz_link: item.branz_link,
        certificate_notes: item.certificate_notes
      });
    } else {
      setEditForm({ ...item });
    }
  };

  const saveEdit = async () => {
    try {
      if (activeTab === 'options') {
        await supabase.from('sched_item_options').update(editForm).eq('id', editingId);
      } else if (activeTab === 'items') {
        await supabase.from('sched_items').update(editForm).eq('id', editingId);
      } else if (activeTab === 'sections') {
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

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}>Loading...</div>;

  const sortedData = getSortedOptions();

  return (
    <div>
      {activeTab === 'options' && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <span style={{ marginRight: '12px' }}>Sort by:</span>
            <button onClick={() => setSortBy('name')} style={{ background: sortBy === 'name' ? '#1B2B4B' : '#f1f5f9', color: sortBy === 'name' ? 'white' : 'black', padding: '6px 14px', borderRadius: '6px', marginRight: '8px' }}>
              Product Name
            </button>
            <button onClick={() => setSortBy('cbi')} style={{ background: sortBy === 'cbi' ? '#1B2B4B' : '#f1f5f9', color: sortBy === 'cbi' ? 'white' : 'black', padding: '6px 14px', borderRadius: '6px' }}>
              CBI Code
            </button>
          </div>

          {sortedData.map((row, index) => (
            <div key={index} style={{ padding: '16px 20px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '12px', position: 'relative' }}>
              <button onClick={() => startEdit(row, 'product')} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#64748b' }}>
                <Edit2 size={18} />
              </button>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>{row.option_label}</div>
              {row.detail && <div style={{ fontSize: '14px', marginTop: '6px' }}>{row.detail}</div>}
              <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '13px', color: '#64748b' }}>
                {row.section} → {row.item} {row.cbi_code && `(${row.cbi_code})`}
              </div>
            </div>
          ))}
        </>
      )}

      {activeTab === 'items' && (
        <div>
          {data.map(item => (
            <div key={item.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '14px', position: 'relative' }}>
              <button onClick={() => startEdit(item, 'item')} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#64748b' }}>
                <Edit2 size={18} />
              </button>
              <strong>{item.label}</strong>
              {item.cbi_code && <span style={{ marginLeft: '12px', color: '#64748b' }}>CBI: {item.cbi_code}</span>}
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>{item.sched_sections?.name}</div>

              <div style={{ fontSize: '13px', color: '#475569' }}>
                <strong>Products:</strong>
                {item.sched_item_options?.length > 0 ? (
                  <ul style={{ marginTop: '6px', paddingLeft: '20px' }}>
                    {item.sched_item_options.map(opt => <li key={opt.id}>{opt.label}</li>)}
                  </ul>
                ) : (
                  <span style={{ color: '#94a3b8' }}> No products assigned</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'sections' && (
        <div>
          {data.map(sec => (
            <div key={sec.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '14px', position: 'relative' }}>
              <button onClick={() => startEdit(sec, 'section')} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#64748b' }}>
                <Edit2 size={18} />
              </button>
              <strong style={{ fontSize: '17px' }}>{sec.name}</strong>

              <div style={{ marginTop: '12px', fontSize: '14px' }}>
                <strong>Elements:</strong>
                {sec.sched_items?.length > 0 ? (
                  <ul style={{ marginTop: '6px', paddingLeft: '20px' }}>
                    {sec.sched_items.map(el => (
                      <li key={el.id}>{el.label} {el.cbi_code && <span style={{ color: '#64748b' }}>({el.cbi_code})</span>}</li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ color: '#94a3b8' }}> No elements yet</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'templates' && <p>Templates coming soon...</p>}

      {/* Edit Modal */}
      {editingId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '520px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Edit</h3>
              <button onClick={cancelEdit}><X size={20} /></button>
            </div>

            <input value={editForm.label || editForm.name || ''} onChange={e => setEditForm({ ...editForm, label: e.target.value, name: e.target.value })} placeholder="Name" style={{ width: '100%', marginBottom: '12px' }} />

            {activeTab === 'items' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '13px', color: '#666' }}>Category</label>
                <select value={editForm.section_id || ''} onChange={e => setEditForm({ ...editForm, section_id: e.target.value })} style={{ width: '100%', padding: '10px', marginTop: '4px' }}>
                  <option value="">Select Category</option>
                  {sectionsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {activeTab === 'options' && (
              <>
                <textarea value={editForm.detail || ''} onChange={e => setEditForm({ ...editForm, detail: e.target.value })} placeholder="Description" style={{ width: '100%', marginBottom: '12px', minHeight: '80px' }} />
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
