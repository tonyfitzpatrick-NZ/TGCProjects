// ============================================================
// src/hooks/useSchedule.js
// Custom hook — loads and manages schedule state for a project.
// Usage: const schedule = useSchedule(projectId)
// Pass null as projectId to skip loading (tab not active yet).
//
// Multi-select update:
//   - An item can now have MULTIPLE products selected at once
//     (e.g. "Entry Door" needs both a Door and a Door Lock),
//     each tracked with its own independent status and note.
//   - selections is now keyed by item_id -> ARRAY of selection
//     rows, instead of item_id -> single selection object.
//   - selectProduct(itemId, productId) ADDS that product to the
//     item's selections (or does nothing if already selected).
//   - deselectProduct(itemId, productId) REMOVES that product
//     from the item's selections entirely.
//   - updateStatus / updateNote / confirmSelection now all take
//     a productId too, since each product's status/note is
//     independent.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import {
  fetchGroups,
  fetchItemsWithProducts,
  fetchProjectSelections,
  upsertProjectSelection,
  deleteProjectSelection,
} from '../lib/scheduleQueries'

export function useSchedule(projectId) {
  const [groups,     setGroups]     = useState([])
  const [items,      setItems]      = useState([])
  const [selections, setSelections] = useState({})  // item_id -> [selection, ...]
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
      setError(`Schedule failed to load: ${e.message}${e.hint ? ' — Hint: ' + e.hint : ''}${e.details ? ' — Details: ' + e.details : ''}${e.code ? ' (code ' + e.code + ')' : ''}`)
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

  // Add a product to an item's selections. If it's already
  // selected, this is a no-op (use updateStatus/updateNote to
  // change an existing selection instead).
  const selectProduct = useCallback(async (itemId, productId) => {
    const existingForItem = selections[itemId] || []
    if (existingForItem.some(s => s.product_id === productId)) return
    setSaving(true)
    setError(null)
    try {
      const created = await upsertProjectSelection({
        projectId,
        itemId,
        productId,
        status: 'specified',
        projectNote: null,
      })
      setSelections(prev => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), created],
      }))
    } catch (e) {
      console.error('selectProduct error:', e)
      setError(`selectProduct failed: ${e.message}${e.hint ? ' — Hint: ' + e.hint : ''}${e.details ? ' — Details: ' + e.details : ''}${e.code ? ' (code ' + e.code + ')' : ''}`)
    } finally {
      setSaving(false)
    }
  }, [projectId, selections])

  // Remove a product from an item's selections entirely.
  const deselectProduct = useCallback(async (itemId, productId) => {
    setSaving(true)
    setError(null)
    try {
      await deleteProjectSelection({ projectId, itemId, productId })
      setSelections(prev => ({
        ...prev,
        [itemId]: (prev[itemId] || []).filter(s => s.product_id !== productId),
      }))
    } catch (e) {
      console.error('deselectProduct error:', e)
      setError(`deselectProduct failed: ${e.message}${e.hint ? ' — Hint: ' + e.hint : ''}${e.details ? ' — Details: ' + e.details : ''}${e.code ? ' (code ' + e.code + ')' : ''}`)
    } finally {
      setSaving(false)
    }
  }, [projectId])

  // Update the status of one specific product's selection on an item.
  const updateStatus = useCallback(async (itemId, productId, status) => {
    const existing = (selections[itemId] || []).find(s => s.product_id === productId)
    if (!existing) return
    setSaving(true)
    setError(null)
    try {
      const updated = await upsertProjectSelection({
        projectId,
        itemId,
        productId,
        status,
        projectNote: existing.project_note || null,
      })
      setSelections(prev => ({
        ...prev,
        [itemId]: (prev[itemId] || []).map(s => s.product_id === productId ? updated : s),
      }))
    } catch (e) {
      console.error('updateStatus error:', e)
      setError(`updateStatus failed: ${e.message}${e.hint ? ' — Hint: ' + e.hint : ''}${e.details ? ' — Details: ' + e.details : ''}${e.code ? ' (code ' + e.code + ')' : ''}`)
    } finally {
      setSaving(false)
    }
  }, [projectId, selections])

  // Update the note on one specific product's selection on an item.
  const updateNote = useCallback(async (itemId, productId, note) => {
    const existing = (selections[itemId] || []).find(s => s.product_id === productId)
    if (!existing) return
    setSaving(true)
    setError(null)
    try {
      const updated = await upsertProjectSelection({
        projectId,
        itemId,
        productId,
        status: existing.status || 'specified',
        projectNote: note,
      })
      setSelections(prev => ({
        ...prev,
        [itemId]: (prev[itemId] || []).map(s => s.product_id === productId ? updated : s),
      }))
    } catch (e) {
      console.error('updateNote error:', e)
      setError(`updateNote failed: ${e.message}${e.hint ? ' — Hint: ' + e.hint : ''}${e.details ? ' — Details: ' + e.details : ''}${e.code ? ' (code ' + e.code + ')' : ''}`)
    } finally {
      setSaving(false)
    }
  }, [projectId, selections])

  // Confirm one specific product's selection on an item
  // (sets status = 'confirmed').
  const confirmSelection = useCallback(async (itemId, productId) => {
    return updateStatus(itemId, productId, 'confirmed')
  }, [updateStatus])

  // Completion stats for the progress bar.
  // An item counts as "confirmed" only when ALL of its selected
  // products are confirmed (and it has at least one selection) —
  // a half-finished item (door confirmed, lock still TBC) is not
  // fully done yet.
  const stats = (() => {
    const total = items.length
    let confirmed = 0
    let specified = 0
    items.forEach(item => {
      const sels = selections[item.id] || []
      if (sels.length === 0) return
      if (sels.every(s => s.status === 'confirmed')) confirmed++
      else specified++
    })
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
    deselectProduct,
    updateStatus,
    updateNote,
    confirmSelection,
  }
}
