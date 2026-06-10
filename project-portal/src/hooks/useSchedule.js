// ============================================================
// useSchedule.js
// Custom hook — loads and manages schedule state for a project.
// Usage: const schedule = useSchedule(projectId)
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import {
  fetchSections,
  fetchItems,
  fetchProjectSelections,
  fetchTemplates,
  upsertSelection,
  applyTemplate,
} from '../lib/scheduleQueries'

export function useSchedule(projectId) {
  const [sections, setSections]       = useState([])
  const [items, setItems]             = useState([])
  const [selections, setSelections]   = useState({})  // keyed by item_id
  const [templates, setTemplates]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [saving, setSaving]           = useState(false)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [secs, itms, sels, tmpls] = await Promise.all([
        fetchSections(),
        fetchItems(),
        fetchProjectSelections(projectId),
        fetchTemplates(),
      ])
      setSections(secs)
      setItems(itms)
      setSelections(sels)
      setTemplates(tmpls)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  // Select an option for an item
  const selectOption = useCallback(async (itemId, optionId, note) => {
    setSaving(true)
    try {
      const updated = await upsertSelection({
        projectId,
        itemId,
        optionId,
        status: optionId ? 'specified' : 'tbc',
        projectNote: note,
      })
      setSelections(prev => ({ ...prev, [itemId]: updated }))
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }, [projectId])

  // Update just the status of an item
  const updateStatus = useCallback(async (itemId, status) => {
    const existing = selections[itemId]
    setSaving(true)
    try {
      const updated = await upsertSelection({
        projectId,
        itemId,
        optionId: existing?.option_id || null,
        status,
        projectNote: existing?.project_note || null,
      })
      setSelections(prev => ({ ...prev, [itemId]: updated }))
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }, [projectId, selections])

  // Add a project note to an item
  const updateNote = useCallback(async (itemId, note) => {
    const existing = selections[itemId]
    setSaving(true)
    try {
      const updated = await upsertSelection({
        projectId,
        itemId,
        optionId: existing?.option_id || null,
        status: existing?.status || 'specified',
        projectNote: note,
      })
      setSelections(prev => ({ ...prev, [itemId]: updated }))
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }, [projectId, selections])

  // Apply a template to the project (sets sched_template_id, doesn't pre-fill selections)
  const applyTemplateToProject = useCallback(async (templateId) => {
    setSaving(true)
    try {
      await applyTemplate(projectId, templateId)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }, [projectId])

  // Derived: items grouped by section
  const itemsBySection = sections.map(section => ({
    ...section,
    items: items.filter(item => item.section_id === section.id),
  }))

  // Derived: completion stats
  const stats = (() => {
    const total = items.length
    if (!total) return { total: 0, confirmed: 0, specified: 0, tbc: 0, pct: 0 }
    const confirmed = items.filter(i => selections[i.id]?.status === 'confirmed').length
    const specified = items.filter(i =>
      selections[i.id]?.status === 'specified' ||
      selections[i.id]?.status === 'substituted'
    ).length
    const tbc = total - confirmed - specified
    return {
      total,
      confirmed,
      specified,
      tbc,
      pct: Math.round((confirmed / total) * 100),
    }
  })()

  return {
    sections,
    items,
    itemsBySection,
    selections,
    templates,
    stats,
    loading,
    error,
    saving,
    reload: load,
    selectOption,
    updateStatus,
    updateNote,
    applyTemplateToProject,
  }
}
