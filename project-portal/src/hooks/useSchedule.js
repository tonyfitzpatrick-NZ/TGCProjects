// ============================================================
// src/hooks/useSchedule.js
// Custom hook — loads and manages schedule state for a project.
// Usage: const schedule = useSchedule(projectId)
// Pass null as projectId to skip loading (tab not active yet).
//
// FIXES vs old version:
//   - Removed query to non-existent view v_sched_project
//   - Uses correct tables: sched_groups, sched_items,
//     sched_item_products, sched_project_selections
//   - Fixed duplicate return statement (was causing build error)
//   - selectOption/updateNote now actually save to the database
//   - Added stats for the progress bar in ScheduleTab
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import {
  fetchGroups,
  fetchItemsWithProducts,
  fetchProjectSelections,
  upsertProjectSelection,
} from '../lib/scheduleQueries'

export function useSchedule(projectId) {
  const [groups,     setGroups]     = useState([])
  const [items,      setItems]      = useState([])
  const [selections, setSelections] = useState({})  // keyed by item_id
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [saving,     setSaving]     = useState(false)

  const load = useCallback(async () => {
    if (!projectId) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const [grps, itms, sels] = await Promise.all([
        fetchGroups(),
        fetchItemsWithProducts(),
        fetchProjectSelections(projectId),
      ])
      setGroups(grps)
      setItems(itms)
      setSelections(sels)
    } catch (e) {
      console.error('useSchedule load error:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  // Items grouped by group for rendering
  const itemsByGroup = groups.map(group => ({
    ...group,
    items: items.filter(i => i.group_id === group.id),
  }))

  // Select a product for an item and save to DB
  const selectProduct = useCallback(async (itemId, productId) => {
    setSaving(true)
    try {
      const existing = selections[itemId]
      const updated = await upsertProjectSelection({
        projectId,
        itemId,
        productId,
        status:      productId ? 'specified' : 'tbc',
        projectNote: existing?.project_note || null,
      })
      setSelections(prev => ({ ...prev, [itemId]: updated }))
    } catch (e) {
      console.error('selectProduct error:', e)
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }, [projectId, selections])

  // Update just the status and save to DB
  const updateStatus = useCallback(async (itemId, status) => {
    setSaving(true)
    try {
      const existing = selections[itemId]
      const updated = await upsertProjectSelection({
        projectId,
        itemId,
        productId:   existing?.product_id || null,
        status,
        projectNote: existing?.project_note || null,
      })
      setSelections(prev => ({ ...prev, [itemId]: updated }))
    } catch (e) {
      console.error('updateStatus error:', e)
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }, [projectId, selections])

  // Save a project note to DB
  const updateNote = useCallback(async (itemId, note) => {
    setSaving(true)
    try {
      const existing = selections[itemId]
      const updated = await upsertProjectSelection({
        projectId,
        itemId,
        productId:   existing?.product_id || null,
        status:      existing?.status || 'tbc',
        projectNote: note,
      })
      setSelections(prev => ({ ...prev, [itemId]: updated }))
    } catch (e) {
      console.error('updateNote error:', e)
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }, [projectId, selections])

  // Confirm a selection (sets status = 'confirmed')
  const confirmSelection = useCallback(async (itemId) => {
    const existing = selections[itemId]
    if (!existing?.product_id) return
    setSaving(true)
    try {
      const updated = await upsertProjectSelection({
        projectId,
        itemId,
        productId:   existing.product_id,
        status:      'confirmed',
        projectNote: existing.project_note || null,
      })
      setSelections(prev => ({ ...prev, [itemId]: updated }))
    } catch (e) {
      console.error('confirmSelection error:', e)
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }, [projectId, selections])

  // Completion stats for the progress bar
  const stats = (() => {
    const total     = items.length
    const confirmed = items.filter(i => selections[i.id]?.status === 'confirmed').length
    const specified = items.filter(i =>
      ['specified', 'substituted'].includes(selections[i.id]?.status)
    ).length
    const tbc = total - confirmed - specified
    return {
      total,
      confirmed,
      specified,
      tbc,
      pct: total ? Math.round((confirmed / total) * 100) : 0,
    }
  })()

  return {
    groups,
    items,
    itemsByGroup,
    selections,
    stats,
    loading,
    error,
    saving,
    reload: load,
    selectProduct,
    updateStatus,
    updateNote,
    confirmSelection,
  }
}
