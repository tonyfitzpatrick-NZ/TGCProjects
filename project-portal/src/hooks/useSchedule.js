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
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data: projectData } = await supabase
        .from('v_sched_project')
        .select('*')
        .eq('project_id', projectId)
        .order('section_order, item_order');

      const grouped = (projectData || []).reduce((acc, row) => {
        let section = acc.find(s => s.name === row.section);
        if (!section) {
          section = { id: row.section, name: row.section, items: [] };
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

        if (row.option_id) {
          if (!item.options.some(o => o.id === row.option_id)) {
            item.options.push({
              id: row.option_id,
              label: row.selected_option || row.option_label,
              detail: row.detail,
              warranty: row.warranty,
              supplier: row.supplier,
              model_ref: row.model_ref
            });
          }
        }
        return acc;
      }, []);

      setItemsBySection(grouped);

      const { data: sels } = await supabase
        .from('sched_project_selections')
        .select('*')
        .eq('project_id', projectId);
      setSelections(Object.fromEntries((sels || []).map(s => [s.item_id, s])));

      const { data: tmpls } = await supabase.from('sched_templates').select('*');
      setTemplates(tmpls || []);

    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const selectOption = useCallback(async (itemId, optionId) => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('sched_project_selections')
        .upsert({
          project_id: projectId,
          item_id: itemId,
          option_id: optionId || null,
          status: optionId ? 'specified' : 'tbc',
        }, { onConflict: 'project_id,item_id' })
        .select()
        .single();

      if (error) throw error;
      setSelections(prev => ({ ...prev, [itemId]: data }));
    } catch (e) {
      console.error(e);
      alert('Failed to save selection');
    } finally {
      setSaving(false);
    }
  }, [projectId]);

  const updateNote = useCallback(async (itemId, note) => {
    const existing = selections[itemId];
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('sched_project_selections')
        .upsert({
          project_id: projectId,
          item_id: itemId,
          option_id: existing?.option_id || null,
          status: existing?.status || 'specified',
          project_note: note,
        }, { onConflict: 'project_id,item_id' })
        .select()
        .single();

      if (error) throw error;
      setSelections(prev => ({ ...prev, [itemId]: data }));
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [projectId, selections]);

  const applyTemplateToProject = useCallback(async (templateId) => {
    if (!templateId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          sched_template_id: templateId,
          sched_stage: 'design' 
        })
        .eq('id', projectId);

      if (error) throw error;

      alert('✅ Template applied successfully!');
      await load();   // Refresh everything
    } catch (e) {
      console.error(e);
      alert('Failed to apply template: ' + (e.message || e));
    } finally {
      setSaving(false);
    }
  }, [projectId, load]);

  const stats = {
    total: itemsBySection.reduce((sum, s) => sum + (s.items?.length || 0), 0),
    confirmed: 0,
    specified: 0,
    tbc: 0,
    pct: 0
  };

  return {
    itemsBySection,
    selections,
    templates,
    stats,
    loading,
    error,
    saving,
    selectOption,
    updateNote,
    applyTemplateToProject,
    reload: load,
  };
}
