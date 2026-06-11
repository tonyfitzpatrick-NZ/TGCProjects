// ============================================================
// useSchedule.js
// Custom hook — loads and manages schedule state for a project.
// Usage: const schedule = useSchedule(projectId)
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useSchedule(projectId) {
  const [itemsBySection, setItemsBySection] = useState([])
  const [selections, setSelections] = useState({})
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)

    try {
      // Load master schedule via view (best performance)
      const { data: projectData } = await supabase
        .from('v_sched_project')
        .select('*')
        .eq('project_id', projectId)
        .order('section_order, item_order')

      // Group into sections → items → options
      const grouped = projectData.reduce((acc, row) => {
        let section = acc.find(s => s.name === row.section)
        if (!section) {
          section = { id: row.section, name: row.section, sort_order: row.section_order, items: [] }
          acc.push(section)
        }

        let item = section.items.find(i => i.id === row.item_id)
        if (!item) {
          item = {
            id: row.item_id,
            label: row.item,
            cbi_code: row.cbi_code,
            options: []
          }
          section.items.push(item)
        }

        // Add option if present
        if (row.option_id) {
          item.options.push({
            id: row.option_id,
            label: row.selected_option || row.option_label,
            detail: row.detail,
            warranty: row.warranty,
            supplier: row.supplier,
            model_ref: row.model_ref,
            is_default: false // can be enhanced later
          })
        }

        return acc
      }, [])

      setItemsBySection(grouped)

      // Load project-specific selections
      const { data: sels } = await supabase
        .from('sched_project_selections')
        .select('*')
        .eq('project_id', projectId)

      setSelections(Object.fromEntries((sels || []).map(s => [s.item_id, s])))

      // Load templates
      const { data: tmpls } = await supabase
        .from('sched_templates')
        .select('*')
        .eq('is_active', true)

      setTemplates(tmpls || [])

    } catch (e) {
      console.error(e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  // ... (keep your existing selectOption, updateStatus, etc. functions)

  const selectOption = useCallback(async (itemId, optionId, note) => {
    // ... your existing logic
  }, [projectId])

  return {
    itemsBySection,
    selections,
    templates,
    loading,
    error,
    saving,
    reload: load,
    selectOption,
    // add other functions as needed
  }
}
