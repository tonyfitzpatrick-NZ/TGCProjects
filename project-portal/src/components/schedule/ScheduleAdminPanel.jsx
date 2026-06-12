// ============================================================
// ScheduleAdminPanel.jsx
// Admin-only panel for adding/editing/deleting item options
// and linking CodeMark / BRANZ / manual documents.
// Only rendered when userRole === 'admin'
// ============================================================

import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Edit2, Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ScheduleAdminPanel() {
  const [activeTab, setActiveTab] = useState('options');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [sortBy, setSortBy] = useState('name'); // 'name' or 'cbi'

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'options') {
        const { data: rows } = await supabase
          .from('v_sched_master')
          .select('*')
          .order('section_order, item_order');
        setData(rows || []);
      }
      if (activeTab === 'items') {
        const { data: rows } = await supabase
          .from('sched_items')
          .select('*, sched_sections(name)')
          .order('sort_order');
        setData(rows || []);
      }
      if (activeTab === 'sections') {
        const { data: rows } = await supabase.from('sched_sections').select('*').order('sort_order');
        setData(rows || []);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // === SORTING FOR OPTIONS TAB ===
  const getSortedOptions = () => {
    if (activeTab !== 'options') return data;

    return [...data].sort((a, b) => {
      if (sortBy === 'name') {
        return (a.option_label || '').localeCompare(b.option_label || '');
      }
      if (sortBy === 'cbi') {
        return (a.cbi_code || '').localeCompare(b.cbi_code || '');
      }
      return 0;
    });
  };

  // === EDIT FUNCTIONS ===
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
      {/* SINGLE TAB BAR */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
        {[
          { key: 'options', label: 'Options & Products' },
          { key: 'items', label: 'Elements (Items)' },
          { key: 'sections', label: 'Categories (Sections)' },
          { key: 'templates', label: 'Templates' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '14px 32px',
              borderBottom: activeTab === tab.key ? '3px solid #1B2B4B' : '3px solid transparent',
              fontWeight: activeTab === tab.key ? '600' : '500',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Master Schedule — Full Edit</h2>
        <button onClick={loadData}><RefreshCw size={16} /> Refresh</button>
      </div>

      {/* OPTIONS & PRODUCTS TAB */}
      {activeTab === 'options' && (
        <>
          {/* Sorting Controls */}
          <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>Sort by:</span>
            <button 
              onClick={() => setSortBy('name')}
              style={{ padding: '6px 14px', background: sortBy === 'name' ? '#1B2B4B' : '#f1f5f9', color: sortBy === 'name' ? 'white' : '#333', borderRadius: '6px' }}
            >
              Product Name
            </button>
            <button 
              onClick={() => setSortBy('cbi')}
              style={{ padding: '6px 14px', background: sortBy === 'cbi' ? '#1B2B4B' : '#f1f5f9', color: sortBy === 'cbi' ? 'white' : '#333', borderRadius: '6px' }}
            >
              CBI Code
            </button>
          </div>

          {sortedData.map((row, index) => (
            <div key={index} style={{ 
              padding: '16px 20px', 
              border: '1px solid #e2e8f0', 
              borderRadius: '10px', 
              marginBottom: '12px',
              position: 'relative'
            }}>
              {/* Small Edit Icon - Top Right */}
              <button 
                onClick={() => startEdit(row, 'product')}
                style={{ 
                  position: 'absolute', 
                  top: '12px', 
                  right: '12px',
                  background: 'none', 
                  border: 'none', 
                  padding: '4px',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                <Edit2 size={18} />
              </button>

              {/* Product Name as Heading */}
              <div style={{ fontWeight: '600', fontSize: '16px', paddingRight: '30px' }}>
                {row.option_label}
              </div>

              {row.detail && <div style={{ fontSize: '14px', marginTop: '6px' }}>{row.detail}</div>}

              {/* Assignment at bottom */}
              <div style={{ 
                marginTop: '14px', 
                paddingTop: '10px', 
                borderTop: '1px solid #f1f5f9',
                fontSize: '13px', 
                color: '#64748b' 
              }}>
                {row.section} → {row.item} {row.cbi_code && `(${row.cbi_code})`}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ITEMS TAB */}
      {activeTab === 'items' && (
        <div>
          {data.map(item => (
            <div key={item.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '12px', position: 'relative' }}>
              <button 
                onClick={() => startEdit(item, 'item')}
                style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#64748b' }}
              >
                <Edit2 size={18} />
              </button>
              <strong>{item.label}</strong>
              {item.cbi_code && <span style={{ marginLeft: '12px', color: '#64748b' }}>CBI: {item.cbi_code}</span>}
              <div style={{ fontSize: '13px', color: '#666' }}>{item.sched_sections?.name}</div>
            </div>
          ))}
        </div>
      )}

      {/* SECTIONS TAB */}
      {activeTab === 'sections' && (
        <div>
          {data.map(sec => (
            <div key={sec.id} style={{ padding: '14px 18px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '10px', position: 'relative' }}>
              <button 
                onClick={() => startEdit(sec, 'section')}
                style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#64748b' }}
              >
                <Edit2 size={18} />
              </button>
              <strong>{sec.name}</strong>
            </div>
          ))}
        </div>
      )}

      {/* Edit Form Modal */}
      {editingId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '520px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Edit</h3>
              <button onClick={cancelEdit}><X size={20} /></button>
            </div>

            {/* Simple form fields - you can expand this later */}
            <input value={editForm.label || editForm.name || ''} onChange={e => setEditForm({ ...editForm, label: e.target.value, name: e.target.value })} placeholder="Name" style={{ width: '100%', marginBottom: '12px' }} />
            
            {activeTab === 'options' && (
              <>
                <textarea value={editForm.detail || ''} onChange={e => setEditForm({ ...editForm, detail: e.target.value })} placeholder="Description" style={{ width: '100%', marginBottom: '12px' }} />
                <input value={editForm.supplier || ''} onChange={e => setEditForm({ ...editForm, supplier: e.target.value })} placeholder="Supplier" style={{ width: '100%', marginBottom: '8px' }} />
                <input value={editForm.warranty || ''} onChange={e => setEditForm({ ...editForm, warranty: e.target.value })} placeholder="Warranty" style={{ width: '100%', marginBottom: '8px' }} />
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
