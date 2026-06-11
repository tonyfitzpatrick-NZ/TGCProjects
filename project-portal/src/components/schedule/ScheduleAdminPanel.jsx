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
      const grouped = (data || []).reduce((acc, row) => { /* same grouping logic */ }, []);
      setSections(grouped);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const saveOptionEdit = async () => {
    if (!editingOptionId) return;

    console.log("Saving option", editingOptionId, editOptionForm);

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
      console.error("Update error:", error);
      alert('Save failed: ' + error.message);
    } else {
      alert('✅ Saved successfully! Refreshing...');
      setEditingOptionId(null);
      await loadData();   // Force reload
    }
  };

  // ... rest of the file remains the same (addNewOption, deleteOption, render) ...

  // (To save space, copy the rest of the return JSX from the previous working version)
