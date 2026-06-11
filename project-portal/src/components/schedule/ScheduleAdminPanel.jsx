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
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // For editing
  const [editingSection, setEditingSection] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'sections') {
        const { data } = await supabase.from('sched_sections').select('*').order('sort_order');
        setSections(data || []);
      }
      if (activeTab === 'items') {
        const { data } = await supabase
          .from('sched_items')
          .select('*, sched_sections(name)')
          .order('sort_order');
        setItems(data || []);
      }
      if (activeTab === 'options') {
        const { data } = await supabase
          .from('v_sched_master')
          .select('*')
          .order('section_order, item_order');
        // group logic here (same as before)
        setSections(groupMasterData(data || []));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Helper to group options (keep your existing grouping logic)
  function groupMasterData(data) {
    // ... (paste your existing grouping reduce logic here)
    return data; // placeholder
  }

  // === SECTIONS CRUD ===
  const saveSection = async (section) => {
    if (!section.name?.trim()) return alert("Name required");
    const { error } = await supabase.from('sched_sections').upsert(section);
    if (error) alert(error.message);
    else {
      setEditingSection(null);
      loadData();
    }
  };

  const deleteSection = async (id) => {
    if (!window.confirm('Delete this section? All items inside will also be affected.')) return;
    await supabase.from('sched_sections').delete().eq('id', id);
    loadData();
  };

  // === ITEMS CRUD ===
  const saveItem = async (item) => {
    if (!item.label?.trim()) return alert("Item name required");
    const { error } = await supabase.from('sched_items').upsert(item);
    if (error) alert(error.message);
    else {
      setEditingItem(null);
      loadData();
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    await supabase.from('sched_items').delete().eq('id', id);
    loadData();
  };

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
        {['options', 'items', 'sections', 'templates'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '14px 28px',
              borderBottom: activeTab === tab ? '3px solid #1B2B4B' : '3px solid transparent',
              fontWeight: activeTab === tab ? '600' : '500',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {tab === 'options' && 'Options & Products'}
            {tab === 'items' && 'Items'}
            {tab === 'sections' && 'Sections'}
            {tab === 'templates' && 'Templates'}
          </button>
        ))}
      </div>

      <h2 style={{ marginBottom: '20px' }}>Master Schedule — Full Edit</h2>

      {/* SECTIONS TAB */}
      {activeTab === 'sections' && (
        <div>
          <button onClick={() => setEditingSection({ name: '', sort_order: 999 })} style={{ marginBottom: '20px' }}>
            <Plus size={16} /> Add New Section
          </button>

          {sections.map(sec => (
            <div key={sec.id} style={{ padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              {editingSection?.id === sec.id ? (
                <input value={editingSection.name} onChange={e => setEditingSection({...editingSection, name: e.target.value})} />
              ) : (
                <strong>{sec.name}</strong>
              )}
              <div>
                {editingSection?.id === sec.id ? (
                  <button onClick={() => saveSection(editingSection)}>Save</button>
                ) : (
                  <>
                    <button onClick={() => setEditingSection(sec)}><Edit2 size={16}/></button>
                    <button onClick={() => deleteSection(sec.id)}><Trash2 size={16}/></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ITEMS TAB */}
      {activeTab === 'items' && (
        <div>
          <button onClick={() => setEditingItem({ label: '', cbi_code: '', section_id: sections[0]?.id })} style={{ marginBottom: '20px' }}>
            <Plus size={16} /> Add New Item
          </button>

          {items.map(item => (
            <div key={item.id} style={{ padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '10px' }}>
              {editingItem?.id === item.id ? (
                <div>
                  <input value={editingItem.label} onChange={e => setEditingItem({...editingItem, label: e.target.value})} placeholder="Item name" />
                  <input value={editingItem.cbi_code} onChange={e => setEditingItem({...editingItem, cbi_code: e.target.value})} placeholder="CBI Code" />
                  <button onClick={() => saveItem(editingItem)}>Save</button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{item.label}</strong> <span style={{ color: '#64748b' }}>({item.sched_sections?.name})</span>
                    {item.cbi_code && <span style={{ marginLeft: '12px', color: '#64748b' }}>CBI: {item.cbi_code}</span>}
                  </div>
                  <div>
                    <button onClick={() => setEditingItem(item)}><Edit2 size={16}/></button>
                    <button onClick={() => deleteItem(item.id)}><Trash2 size={16}/></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* OPTIONS TAB (existing working version) */}
      {activeTab === 'options' && (
        <div>
          {/* Keep your current working Options & Products content here */}
          <p>Options & Products content (your current working version)</p>
        </div>
      )}

      {activeTab === 'templates' && <p>Templates tab coming soon...</p>}
    </div>
  );
}
