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

  const load = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { data: projectData, error: pdError } = await supabase
        .from('v_sched_project')
        .select('*')
        .eq('project_id', projectId)
        .order('section_order, item_order');

      if (pdError) throw pdError;

      // Group data safely
      const grouped = (projectData || []).reduce((acc, row) => {
        let section = acc.find(s => s.name === row.section);
        if (!section) {
          section = { id: row.section, name: row.section, sort_order: row.section_order || 0, items: [] };
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

        return acc;
      }, []);

      setItemsBySection(grouped);

      // Load selections
      const { data: sels } = await supabase
        .from('sched_project_selections')
        .select('*')
        .eq('project_id', projectId);
      setSelections(Object.fromEntries((sels || []).map(s => [s.item_id, s])));

      // Templates
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

  return {
    itemsBySection,
    selections,
    templates,
    loading,
    error,
    reload: load,
  };
}
