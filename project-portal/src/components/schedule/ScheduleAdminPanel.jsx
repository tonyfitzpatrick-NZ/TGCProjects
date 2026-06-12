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

  const [editingProduct, setEditingProduct] = useState(null);
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

  // === PRODUCT EDITING ===
  const startEditProduct = (product) => {
    setEditingProduct(product.option_id);
    setEditForm({
      label: product.option_label,
      detail: product.detail,
      warranty: product.warranty,
      supplier: product.supplier,
      product_link: product.product_link,
      codemark_link: product.codemark_link,
      branz_link: product.branz_link,
      certificate_notes: product.certificate_notes
    });
  };

  const saveProduct = async () => {
    const { error } = await supabase
      .from('sched_item_options')
      .update(editForm)
      .eq('id', editingProduct);

    if (error) {
      alert('Save failed: ' + error.message);
    } else {
      setEditingProduct(null);
      loadData();
    }
  };

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      {/* SINGLE CLEAN TAB BAR */}
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

      <h2 style={{ marginBottom: '20px' }}>Master Schedule — Full Edit</h2>

      {/* OPTIONS & PRODUCTS TAB */}
      {activeTab === 'options' && (
        <div>
          {data.map((row, index) => (
            <div key={index} style={{ 
              padding: '16px 20px', 
              border: '1px solid #e2e8f0', 
              borderRadius: '10px', 
              marginBottom: '12px',
              background: '#fff'
            }}>
              {/* Product Name as Heading */}
              <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '8px' }}>
                {row.option_label}
              </div>

              {row.detail && <div style={{ fontSize: '14px', marginBottom: '8px' }}>{row.detail}</div>}

              {/* Assignment info at the BOTTOM */}
              <div style={{ 
                marginTop: '12px', 
                paddingTop: '10px', 
                borderTop: '1px solid #f1f5f9',
                fontSize: '13px', 
                color: '#64748b' 
              }}>
                {row.section} → {row.item}
              </div>

              {/* Edit button */}
              <button 
                onClick={() => startEditProduct(row)}
                style={{ 
                  marginTop: '12px',
                  padding: '6px 14px', 
                  fontSize: '13px',
                  background: '#f8fafc',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <Edit2 size={14} style={{ marginRight: 6 }} /> Edit Product
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Edit Product Modal / Form */}
      {editingProduct && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>Edit Product</h3>
              <button onClick={() => setEditingProduct(null)}><X size={20} /></button>
            </div>

            <input value={editForm.label || ''} onChange={e => setEditForm({...editForm, label: e.target.value})} placeholder="Product Name" style={{ width: '100%', marginBottom: '12px' }} />
            <textarea value={editForm.detail || ''} onChange={e => setEditForm({...editForm, detail: e.target.value})} placeholder="Description" style={{ width: '100%', marginBottom: '12px', minHeight: '80px' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <input value={editForm.supplier || ''} onChange={e => setEditForm({...editForm, supplier: e.target.value})} placeholder="Supplier" />
              <input value={editForm.warranty || ''} onChange={e => setEditForm({...editForm, warranty: e.target.value})} placeholder="Warranty" />
            </div>

            <input value={editForm.product_link || ''} onChange={e => setEditForm({...editForm, product_link: e.target.value})} placeholder="Product Link" style={{ width: '100%', marginBottom: '8px' }} />
            <input value={editForm.codemark_link || ''} onChange={e => setEditForm({...editForm, codemark_link: e.target.value})} placeholder="CodeMark Link" style={{ width: '100%', marginBottom: '8px' }} />
            <input value={editForm.branz_link || ''} onChange={e => setEditForm({...editForm, branz_link: e.target.value})} placeholder="BRANZ Link" style={{ width: '100%', marginBottom: '8px' }} />

            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button onClick={saveProduct} style={{ background: '#166534', color: 'white', padding: '10px 24px', borderRadius: '8px' }}>Save Changes</button>
              <button onClick={() => setEditingProduct(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ITEMS TAB */}
      {activeTab === 'items' && (
        <div>
          {data.map(item => (
            <div key={item.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{item.label}</strong>
                  {item.cbi_code && <span style={{ marginLeft: '12px', color: '#64748b' }}>CBI: {item.cbi_code}</span>}
                  <div style={{ fontSize: '13px', color: '#666' }}>{item.sched_sections?.name}</div>
                </div>
                <button onClick={() => alert('Edit item coming in next update')}><Edit2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTIONS TAB */}
      {activeTab === 'sections' && (
        <div>
          {data.map(sec => (
            <div key={sec.id} style={{ padding: '14px 18px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <strong>{sec.name}</strong>
              <button onClick={() => alert('Edit section coming soon')}><Edit2 size={18} /></button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'templates' && <p>Templates tab coming soon...</p>}
    </div>
  );
}
