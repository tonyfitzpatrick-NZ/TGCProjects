import React, { useState, useEffect } from 'react';
import { Edit2, X, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ScheduleAdminPanel({ activeTab = 'options' }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === 'options') {
        const { data: rows } = await supabase.from('v_sched_master').select('*').order('section_order, item_order');
        setData(rows || []);
      } else if (activeTab === 'items') {
        const { data: items } = await supabase.from('sched_items').select('*').order('sort_order');
        setData(items || []);
      } else if (activeTab === 'sections') {
        const { data: secs } = await supabase.from('sched_sections').select('*').order('sort_order');
        setData(secs || []);
      } else {
        setData([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const openAddModal = () => {
    setIsCreating(true);
    setEditingId(null);
    if (activeTab === 'options') setEditForm({ label: '', detail: '' });
    else if (activeTab === 'items') setEditForm({ label: '', cbi_code: '' });
    else if (activeTab === 'sections') setEditForm({ name: '' });
  };

  const startEdit = (row) => {
    setIsCreating(false);
    setEditingId(row.id || row.option_id);
    if (activeTab === 'options') {
      setEditForm({ label: row.option_label || '', detail: row.detail || '' });
    } else if (activeTab === 'items') {
      setEditForm({ label: row.label || '', cbi_code: row.cbi_code || '' });
    } else if (activeTab === 'sections') {
      setEditForm({ name: row.name || '' });
    }
  };

  const saveEdit = async () => {
    try {
      if (activeTab === 'options') {
        await supabase.from('sched_item_options').update({ label: editForm.label, detail: editForm.detail }).eq('id', editingId);
      } else if (activeTab === 'items') {
        await supabase.from('sched_items').update({ label: editForm.label, cbi_code: editForm.cbi_code }).eq('id', editingId);
      } else if (activeTab === 'sections') {
        await supabase.from('sched_sections').update({ name: editForm.name }).eq('id', editingId);
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
  };

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}>Loading...</div>;

  if (activeTab !== 'options') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
          <button onClick={openAddModal} style={{ padding: '8px 16px', background: '#166534', color: 'white', border: 'none', borderRadius: '8px' }}>
            <Plus size={16} /> Add New
          </button>
        </div>

        {data.map((row, index) => (
          <div key={index} style={{ padding: '18px 22px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '14px', position: 'relative', background: '#fff' }}>
            <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
              <button onClick={() => startEdit(row)}><Edit2 size={18} /></button>
            </div>
            <div style={{ fontWeight: '600' }}>{row.name || row.label || row.option_label}</div>
          </div>
        ))}
      </div>
    );
  }

  // Options tab (simplified)
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
          <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
            <button onClick={() => startEdit(row)}><Edit2 size={18} /></button>
          </div>
          <div style={{ fontWeight: '600' }}>{row.option_label}</div>
        </div>
      ))}
    </div>
  );
}
