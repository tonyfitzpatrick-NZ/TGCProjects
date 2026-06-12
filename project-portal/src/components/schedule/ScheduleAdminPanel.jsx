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
  const [activeTab, setActiveTab] = useState('options');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          .select('*, sched_sections(name), sched_item_options(id, label)')
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

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      {/* Single clean tab bar */}
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
            <div key={index} style={{ padding: '14px 18px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '10px' }}>
              <strong>{row.section} → {row.item}</strong><br />
              <span>{row.option_label}</span>
              {row.product_link && <div><a href={row.product_link} target="_blank">Product Link</a></div>}
            </div>
          ))}
        </div>
      )}

      {/* ELEMENTS (ITEMS) TAB */}
      {activeTab === 'items' && (
        <div>
          <p style={{ marginBottom: '16px', color: '#666' }}>
            Elements = the dropdown choices in a project (e.g. Exterior Doors, Cladding). 
            You can assign multiple Products to each Element here.
          </p>
          {data.map(item => (
            <div key={item.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{item.label}</strong> 
                  {item.cbi_code && <span style={{ marginLeft: '12px', color: '#64748b' }}>CBI: {item.cbi_code}</span>}
                  <div style={{ fontSize: '13px', color: '#666' }}>{item.sched_sections?.name}</div>
                </div>
                <div>
                  <button><Edit2 size={16} /></button>
                  <button><Trash2 size={16} /></button>
                </div>
              </div>

              {/* Show assigned products */}
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Assigned Products:</div>
                {item.sched_item_options?.length > 0 ? (
                  item.sched_item_options.map(opt => (
                    <div key={opt.id} style={{ fontSize: '14px', paddingLeft: '8px' }}>• {opt.label}</div>
                  ))
                ) : (
                  <div style={{ fontSize: '13px', color: '#999' }}>No products assigned yet</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTIONS (CATEGORIES) TAB */}
      {activeTab === 'sections' && (
        <div>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Categories group your Elements (e.g. Exterior, Interior, Bathrooms).
          </p>
          {data.map(sec => (
            <div key={sec.id} style={{ padding: '14px 18px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <strong>{sec.name}</strong>
              <div>
                <button><Edit2 size={16} /></button>
                <button><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'templates' && <p>Templates coming soon...</p>}
    </div>
  );
}
