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
      // Main project schedule data
      const { data: projectData } = await supabase
        .from('v_sched_project')
        .select('*')
        .eq('project_id', projectId)
        .order('section_order, item_order');

      const grouped = (projectData || []).reduce((acc, row) => {
        let section = acc.find(s => s.name === row.section);
        if (!section) {
          section = { 
            id: row.section, 
            name: row.section, 
            sort_order: row.section_order || 0, 
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

        return acc;
      }, []);

      setItemsBySection(grouped);

      // Selections
      const { data: selsData } = await supabase
        .from('sched_project_selections')
        .select('*')
        .eq('project_id', projectId);

      setSelections(Object.fromEntries((selsData || []).map(s => [s.item_id, s])));

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

  useEffect(() => {
    load();
  }, [load]);

  // Safe stats calculation
  const stats = {
    total: itemsBySection.reduce((sum, s) => sum + (s.items?.length || 0), 0),
    confirmed: 0,
    specified: 0,
    tbc: 0,
    pct: 0
  };

  // Update stats based on selections (if data exists)
  if (itemsBySection.length > 0) {
    let confirmed = 0, specified = 0, tbc = 0;
    itemsBySection.forEach(section => {
      (section.items || []).forEach(item => {
        const sel = selections[item.id];
        if (sel?.status === 'confirmed') confirmed++;
        else if (sel?.status === 'specified' || sel?.status === 'substituted') specified++;
        else tbc++;
      });
    });
    stats.confirmed = confirmed;
    stats.specified = specified;
    stats.tbc = tbc;
    stats.pct = stats.total > 0 ? Math.round((confirmed / stats.total) * 100) : 0;
  }

  return {
    itemsBySection,
    selections,
    templates,
    stats,
    loading,
    error,
    saving,
    reload: load,
  };
}
