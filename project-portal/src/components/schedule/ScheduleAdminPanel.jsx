import React, { useState, useEffect } from 'react';
import { Edit2, X, Trash2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ScheduleAdminPanel({ activeTab = 'options' }) {
  const [data, setData] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [assignedItems, setAssignedItems] = useState([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      if (activeTab === 'options') {
        const { data: rows } = await supabase.from('v_sched_master').select('*').order('section_order, item_order');
        setData(rows || []);
      }
      const { data: items } = await supabase.from('sched_items').select('id, label, cbi_code').order('sort_order');
      setItemsList(items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const openAddModal = () => {
    setIsCreating(true);
    setEditingId(null);
    setAssignedItems([]);
    setEditForm({ label: '', detail: '', product_link: '', branz_link: '', codemark_link: '', certificate_notes: '' });
  };

  const startEdit = (row) => {
    setIsCreating(false);
    setEditingId(row.option_id);
    setEditForm({
      label: row.option_label || '',
      detail: row.detail || '',
      product_link: row.product_link || '',
      branz_link: row.branz_link || '',
      codemark_link: row.codemark_link || '',
      certificate_notes: row.certificate_notes || ''
    });
  };

  const saveEdit = async () => {
    try {
      const productData = {
        label: editForm.label,
        detail: editForm.detail || null,
        product_link: editForm.product_link || null,
        branz_link: editForm.branz_link || null,
        codemark_link: editForm.codemark_link || null,
        certificate_notes: editForm.certificate_notes || null
      };

      if (isCreating) {
        await supabase.from('sched_item_options').insert(productData);
      } else {
        await supabase.from('sched_item_options').update(productData).eq('id', editingId);
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

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}>Loading...</div>;

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
          <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
            <button onClick={() => startEdit(row)}><Edit2 size={18} /></button>
            <button onClick={() => {}}><Trash2 size={18} color="#ef4444" /></button>
          </div>
          <div style={{ fontWeight: '600' }}>{row.option_label}</div>
          {row.detail && <div>{row.detail}</div>}
        </div>
      ))}
    </div>
  );
}
