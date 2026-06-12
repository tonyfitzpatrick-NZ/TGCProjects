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
      const { data: rows } = await supabase.from('v_sched_master').select('*').order('section_order, item_order');
      setData(rows || []);

      const { data: items } = await supabase.from('sched_items').select('id, label, cbi_code').order('sort_order');
      setItemsList(items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadAssignedItems(optionId) {
    const { data } = await supabase
      .from('sched_item_option_assignments')
      .select('item_id, sched_items(label)')
      .eq('option_id', optionId);
    setAssignedItems(data || []);
  }

  const startEdit = async (row) => {
    setIsCreating(false);
    setEditingId(row.option_id);
    setEditForm({
      label: row.option_label || row.label || '',
      detail: row.detail || '',
      product_link: row.product_link || '',
      branz_link: row.branz_link || '',
      codemark_link: row.codemark_link || '',
      certificate_notes: row.certificate_notes || ''
    });
    await loadAssignedItems(row.option_id);
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

      let optionId = editingId;

      if (isCreating) {
        const { data: newOpt } = await supabase.from('sched_item_options').insert(productData).select().single();
        optionId = newOpt.id;
      } else {
        await supabase.from('sched_item_options').update(productData).eq('id', editingId);
      }

      if (optionId) {
        await supabase.from('sched_item_option_assignments').delete().eq('option_id', optionId);
        if (assignedItems.length > 0) {
          const assignments = assignedItems.map(a => ({ item_id: a.item_id, option_id: optionId }));
          await supabase.from('sched_item_option_assignments').insert(assignments);
        }
      }

      setEditingId(null);
      setIsCreating(false);
      setAssignedItems([]);
      loadData();
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
  };

  // ... rest of the file (addItemToProduct, removeItemFromProduct, modal JSX) remains the same as previous

  // (To save space, please keep the full modal and helper functions from the last version I gave you)

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      <h2>Options & Products</h2>
      {/* cards and modal from previous version */}
      {/* ... */}
    </div>
  );
}
