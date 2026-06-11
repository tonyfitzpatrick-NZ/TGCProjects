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
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingOptionId, setEditingOptionId] = useState(null);
  const [editOptionForm, setEditOptionForm] = useState({});

  const [addingOptionToItem, setAddingOptionToItem] = useState(null);
  const [newOptionForm, setNewOptionForm] = useState({ 
    label: '', detail: '', warranty: '', supplier: '', model_ref: '', 
    product_link: '', codemark_link: '', branz_link: '', certificate_notes: '' 
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const { data, error: qError } = await supabase
        .from('v_sched_master')
        .select('*')
        .order('section_order, item_order');

      if (qError) throw qError;

      const grouped = (data || []).reduce((acc, row) => {
        let section = acc.find(s => s.name === row.section);
        if (!section) {
          section = { name: row.section, items: [] };
          acc.push(section);
        }

        let item = section.items.find(i => i.id === row.item_id);
        if (!item) {
          item = { id: row.item_id, label: row.item || 'Unknown', cbi_code: row.cbi_code, options: [] };
          section.items.push(item);
        }

        if (row.option_id) {
          item.options.push({
            id: row.option_id,
            label: row.option_label,
            detail: row.detail,
            warranty: row.warranty,
            supplier: row.supplier,
            model_ref: row.model_ref,
            product_link: row.product_link,
            codemark_link: row.codemark_link,
            branz_link: row.branz_link,
            certificate_notes: row.certificate_notes
          });
        }
        return acc;
      }, []);

      setSections(grouped);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const startEditOption = (opt) => {
    setEditingOptionId(opt.id);
    setEditOptionForm({ ...opt });
  };

  const saveOptionEdit = async () => {
    if (!editingOptionId) return;

    const { error } = await supabase
      .from('sched_item_options')
      .update({
        label: editOptionForm.label,
        detail: editOptionForm.detail,
        warranty: editOptionForm.warranty,
        supplier: editOptionForm.supplier,
        model_ref: editOptionForm.model_ref,
        product_link: editOptionForm.product_link,
        codemark_link: editOptionForm.codemark_link,
        branz_link: editOptionForm.branz_link,
        certificate_notes: editOptionForm.certificate_notes
      })
      .eq('id', editingOptionId);

    if (error) {
      alert('Save failed: ' + error.message);
    } else {
      alert('✅ Changes saved successfully!');
      setEditingOptionId(null);
      setEditOptionForm({});
      await loadData();   // Force full reload
    }
  };

  const addNewOption = async (itemId) => {
    if (!newOptionForm.label?.trim()) {
      alert("Option label is required");
      return;
    }

    const { error } = await supabase
      .from('sched_item_options')
      .insert({
        item_id: itemId,
        ...newOptionForm
      });

    if (error) {
      alert('Failed to add: ' + error.message);
    } else {
      alert('✅ New option added!');
      setAddingOptionToItem(null);
      setNewOptionForm({ label: '', detail: '', warranty: '', supplier: '', model_ref: '', product_link: '', codemark_link: '', branz_link: '', certificate_notes: '' });
      await loadData();
    }
  };

  const deleteOption = async (id) => {
    if (!window.confirm('Delete this option permanently?')) return;
    const { error } = await supabase.from('sched_item_options').delete().eq('id', id);
    if (error) alert('Delete failed');
    else await loadData();
  };

  if (loading) return <div style={{ padding: '80px', textAlign: 'center' }}>Loading master schedule...</div>;

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
        <h2>Master Schedule — Full Edit</h2>
        <button onClick={loadData} style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: 8 }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div style={{ padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

      {sections.map(section => (
        <div key={section.name} style={{ marginBottom: '48px' }}>
          <h3 style={{ fontSize: '22px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            {section.name}
          </h3>

          {section.items.map(item => (
            <div key={item.id} style
