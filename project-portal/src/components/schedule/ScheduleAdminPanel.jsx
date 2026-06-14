import React, { useState, useEffect } from 'react';
import { Edit2, X, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ScheduleAdminPanel({ activeTab = 'options' }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [currentRow, setCurrentRow] = useState(null);
  const [editForm, setEditForm] = useState({});

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

  const startEdit = (row) => {
    setCurrentRow(row);
    setEditForm({
      label: row.option_label || row.label || row.name || '',
      detail: row.detail || '',
      name: row.name || ''
    });
    setShowModal(true);
  };

  const saveEdit = async () => {
    try {
      if (activeTab === 'options') {
        await supabase.from('sched_item_options').update({ label: editForm.label }).eq('id', currentRow.option_id);
      } else if (activeTab === 'items') {
        await supabase.from('sched_items').update({ label: editForm.label }).eq('id', currentRow.id);
      } else if (activeTab === 'sections') {
        await supabase.from('sched_sections').update({ name: editForm.name }).eq('id', currentRow.id);
      }
      setShowModal(false);
      loadData();
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>{activeTab === 'options' ? 'Options & Products' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
        <button onClick={() => { alert('Add new coming soon'); }} style={{ padding: '8px 16px', background: '#166534', color: 'white', border: 'none', borderRadius: '8px' }}>
          <Plus size={16} /> Add New
        </button>
      </div>

      {data.map((row, index) => (
        <div key={index} style={{ padding: '18px 22px', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '14px', position: 'relative', background: '#fff' }}>
          <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
            <button onClick={() => startEdit(row)}><Edit2 size={18} /></button>
          </div>
          <div style={{ fontWeight: '600' }}>{row.option_label || row.label || row.name}</div>
          {row.detail && <div style={{ color: '#666' }}>{row.detail}</div>}
        </div>
      ))}

      {/* Simple Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '400px' }}>
            <h3>Edit</h3>
            <input 
              value={editForm.label || editForm.name || ''} 
              onChange={(e) => setEditForm({ ...editForm, label: e.target.value, name: e.target.value })} 
              style={{ width: '100%', padding: '10px', margin: '15px 0', border: '1px solid #ccc' }} 
              placeholder="Name" 
            />
            <div style={{ marginTop: '20px' }}>
              <button onClick={saveEdit} style={{ background: '#166534', color: 'white', padding: '10px 20px', marginRight: '10px' }}>Save</button>
              <button onClick={closeModal} style={{ padding: '10px 20px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
