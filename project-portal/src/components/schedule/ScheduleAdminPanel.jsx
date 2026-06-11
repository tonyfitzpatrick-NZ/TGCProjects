// ============================================================
// ScheduleAdminPanel.jsx
// Admin-only panel for adding/editing/deleting item options
// and linking CodeMark / BRANZ / manual documents.
// Only rendered when userRole === 'admin'
// ============================================================

import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ScheduleAdminPanel() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Simple direct query - more reliable
      const { data: sectionsData } = await supabase
        .from('sched_sections')
        .select('*')
        .order('sort_order');

      const { data: itemsData } = await supabase
        .from('sched_items')
        .select('*, sched_item_options(*)')
        .order('sort_order');

      const grouped = sectionsData.map(section => {
        const sectionItems = itemsData.filter(item => item.section_id === section.id);
        return {
          ...section,
          items: sectionItems
        };
      });

      setSections(grouped);
    } catch (e) {
      console.error(e);
      alert("Failed to load master data. Please check the database tables exist.");
      setSections([]);
    } finally {
      setLoading(false);
    }
  }

  const deleteOption = async (optionId) => {
    if (!window.confirm('Delete this option?')) return;
    await supabase.from('sched_item_options').delete().eq('id', optionId);
    loadData();
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Loading master schedule...</div>;

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <h2>Master Schedule — All Sections</h2>
        <button onClick={loadData} style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: 8 }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {sections.map(section => (
        <div key={section.id} style={{ marginBottom: '40px' }}>
          <h3 style={{ fontSize: '22px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            {section.name}
          </h3>

          {section.items.map(item => (
            <div key={item.id} style={{ 
              background: '#fff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px', 
              padding: '20px', 
              marginBottom: '20px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <strong>{item.label}</strong>
                  {item.cbi_code && <span style={{ marginLeft: '12px', color: '#64748b' }}>CBI: {item.cbi_code}</span>}
                </div>
              </div>

              {item.sched_item_options && item.sched_item_options.length > 0 ? (
                item.sched_item_options.map(opt => (
                  <div key={opt.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{opt.label}</div>
                      {opt.detail && <div style={{ fontSize: '13px' }}>{opt.detail}</div>}
                      {opt.supplier && <div>Supplier: {opt.supplier}</div>}
                      {opt.warranty && <div>Warranty: {opt.warranty}</div>}
                    </div>
                    <button onClick={() => deleteOption(opt.id)} style={{ color: '#ef4444' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ color: '#888' }}>No options defined yet</p>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
