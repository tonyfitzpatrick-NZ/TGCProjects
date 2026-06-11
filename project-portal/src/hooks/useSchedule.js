// ============================================================
// useSchedule.js
// Custom hook — loads and manages schedule state for a project.
// Usage: const schedule = useSchedule(projectId)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useSchedule(projectId) {
  const [itemsBySection, setItemsBySection] = useState([]);
  const [selections, setSelections] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      // Get all schedule data for this project (including new link fields)
      const { data: projectData, error: projectError } = await supabase
        .from('v_sched_project')
        .select('*')
        .eq('project_id', projectId)
        .order('section_order, item_order');

      if (projectError) throw projectError;

      // Group into sections → items → options (with links)
      const grouped = (projectData || []).reduce((acc, row) => {
        let section = acc.find(s => s.id === row.section_id);
        if (!section) {
          section = { id: row.section_id, name: row.section, items: [] };
          acc.push(section);
        }

        let item = section.items.find(i => i.id === row.item_id);
        if (!item) {
          item = {
            id: row.item_id,
            label: row.item,
            cbi_code: row.cbi_code,
            options: []
          };
          section.items.push(item);
        }

        // Add option with all link fields
        if (row.option_id) {
          const existing = item.options.find(o => o.id === row.option_id);
          if (!existing) {
            item.options.push({
              id: row.option_id,
              label: row.option_label,
              detail: row.detail,
              warranty: row.warranty,
              supplier: row.supplier,
              product_link: row.product_link,
              codemark_link: row.codemark_link,
              branz_link: row.branz_link,
              certificate_notes: row.certificate_notes
            });
          }
        }

        return acc;
      }, []);

      setItemsBySection(grouped);

      // Load existing selections
      const { data: selData } = await supabase
        .from('sched_project_selections')
        .select('*')
        .eq('project_id', projectId);

      const selMap = {};
      (selData || []).forEach(s => {
        selMap[s.item_id] = {
          option_id: s.option_id,
          status: s.status,
          project_note: s.project_note
        };
      });
      setSelections(selMap);

    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  // ... rest of your existing functions (selectOption, confirmSelection, updateNote, etc.) stay the same
  const selectOption = useCallback(async (itemId, optionId) => {
    setSelections(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], option_id: optionId }
    }));
  }, []);

  const updateNote = useCallback(async (itemId, note) => {
    setSelections(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], project_note: note }
    }));
  }, []);

  const confirmSelection = useCallback(async (itemId) => {
    const current = selections[itemId];
    if (!current?.option_id) return;

    try {
      await supabase
        .from('sched_project_selections')
        .upsert({
          project_id: projectId,
          item_id: itemId,
          option_id: current.option_id,
          status: 'confirmed',
          project_note: current.project_note || null
        }, { onConflict: 'project_id,item_id' });

      // Refresh to get latest status
      await load();
    } catch (e) {
      console.error(e);
      alert('Failed to save selection');
    }
  }, [selections, projectId, load]);

  return {
    itemsBySection,
    selections,
    loading,
    error,
    refresh: load,
    selectOption,
    updateNote,
    confirmSelection
  };
  return {
    itemsBySection,
    selections,
    loading,
    error,
    refresh: load,
    // include your other functions here
  };
}
