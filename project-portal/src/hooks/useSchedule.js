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
      // Get full project schedule with options
      const { data: projectData } = await supabase
        .from('v_sched_project')
        .select('*')
        .eq('project_id', projectId)
        .order('section_order, item_order');

      // Group into sections → items → options
      const grouped = (projectData || []).reduce((acc, row) => {
        let section = acc.find(s => s.name === row.section);
        if (!section) {
          section = { 
            id: row.section, 
            name: row.section, 
            items: [] 
          };
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

        // Add option if present
        if (row.option_id) {
          const existingOption = item.options.find(o => o.id === row.option_id);
          if (!existingOption) {
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

      // Load project selections
      const { data: sels } = await supabase
        .from('sched_project_selections')
        .select('*')
        .eq('project_id', projectId);
      
      setSelections(Object.fromEntries((sels || []).map(s => [s.item_id, s])));

      // Templates
      const { data: tmpls } = await supabase
        .from('sched_templates')
        .select('*')
        .eq('is_active', true);
      setTemplates(tmpls || []);

    } catch (e) {
      console.error('Schedule load error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

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
    reload: load,
  };
}
