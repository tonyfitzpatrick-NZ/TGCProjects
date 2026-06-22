// ============================================================
// src/lib/scheduleQueries.js
// All Supabase queries for the Schedule of Finishes module.
//
// FIXES vs old version:
//   - Uses shared supabase client (no env vars, works on Netlify)
//   - Correct table names: sched_groups, sched_items,
//     sched_products, sched_item_products, sched_project_selections
//   - Removed references to non-existent tables:
//     sched_sections, sched_item_options, sched_option_docs,
//     sched_templates, v_sched_project
// ============================================================

import { supabase } from './supabase'

// ── Master library reads ─────────────────────────────────────

export async function fetchGroups() {
  const { data, error } = await supabase
    .from('sched_groups')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data || []
}

export async function fetchItemsWithProducts() {
  const { data: items, error: ie } = await supabase
    .from('sched_items')
    .select('*')
    .order('sort_order')
  if (ie) throw ie

  const { data: links, error: le } = await supabase
    .from('sched_item_products')
    .select(`
      *,
      sched_products (
        id, name, manufacturer,
        url_website, url_branz_appraisal,
        url_codemark, url_install_manual
      )
    `)
    .order('sort_order')
  if (le) throw le

  // Attach assigned products to each item
  const map = {}
  ;(links || []).forEach(r => {
    if (!map[r.item_id]) map[r.item_id] = []
    map[r.item_id].push(r)
  })

  return (items || []).map(item => ({
    ...item,
    assignedProducts: map[item.id] || [],
  }))
}

export async function fetchProducts({ includeInactive = false } = {}) {
  let q = supabase.from('sched_products').select('*').order('name')
  if (!includeInactive) q = q.eq('is_active', true)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

// ── Project selections ───────────────────────────────────────

// Returns selections keyed by item_id, where each value is an
// ARRAY of selection rows — an item can now have multiple
// products selected, each with its own status and note.
export async function fetchProjectSelections(projectId) {
  const { data, error } = await supabase
    .from('sched_project_selections')
    .select('*, sched_products(id, name, manufacturer, url_website, url_branz_appraisal, url_codemark, url_install_manual)')
    .eq('project_id', projectId)
  if (error) throw error
  const byItem = {}
  ;(data || []).forEach(s => {
    if (!byItem[s.item_id]) byItem[s.item_id] = []
    byItem[s.item_id].push(s)
  })
  return byItem
}

// Adds or updates a single product's selection on an item.
// productId is required — a selection row always represents one
// specific product chosen for one item; to remove a product from
// an item's selections entirely, use deleteProjectSelection.
export async function upsertProjectSelection({
  projectId, itemId, productId, status, projectNote,
}) {
  if (!productId) throw new Error('upsertProjectSelection requires a productId')
  const { data, error } = await supabase
    .from('sched_project_selections')
    .upsert(
      {
        project_id:   projectId,
        item_id:      itemId,
        product_id:   productId,
        status:       status || 'specified',
        project_note: projectNote || null,
        updated_at:   new Date().toISOString(),
      },
      { onConflict: 'project_id,item_id,product_id' }
    )
    .select('*, sched_products(id, name, manufacturer, url_website, url_branz_appraisal, url_codemark, url_install_manual)')
    .single()
  if (error) throw error
  return data
}

// Removes one product's selection from an item entirely
// (e.g. unchecking it in the picker).
export async function deleteProjectSelection({ projectId, itemId, productId }) {
  const { error } = await supabase
    .from('sched_project_selections')
    .delete()
    .eq('project_id', projectId)
    .eq('item_id', itemId)
    .eq('product_id', productId)
  if (error) throw error
}

// ── Admin: groups ────────────────────────────────────────────

export async function createGroup({ name, description, sort_order }) {
  const { data, error } = await supabase
    .from('sched_groups')
    .insert({ name, description: description || null, sort_order: sort_order || 0 })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateGroup(id, updates) {
  const { data, error } = await supabase
    .from('sched_groups')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteGroup(id) {
  const { error } = await supabase
    .from('sched_groups')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Admin: items ─────────────────────────────────────────────

export async function createItem({ group_id, name, description, sort_order }) {
  const { data, error } = await supabase
    .from('sched_items')
    .insert({ group_id, name, description: description || null, sort_order: sort_order || 0 })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateItem(id, updates) {
  const { data, error } = await supabase
    .from('sched_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteItem(id) {
  const { error } = await supabase
    .from('sched_items')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Admin: products ──────────────────────────────────────────

export async function createProduct(payload) {
  const { data, error } = await supabase
    .from('sched_products')
    .insert({ ...payload, is_active: true, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProduct(id, payload) {
  const { data, error } = await supabase
    .from('sched_products')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase
    .from('sched_products')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Admin: item–product assignments ─────────────────────────

export async function assignProductToItem({ item_id, product_id, is_default = false }) {
  const { data, error } = await supabase
    .from('sched_item_products')
    .insert({ item_id, product_id, is_default })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeProductFromItem(item_id, product_id) {
  const { error } = await supabase
    .from('sched_item_products')
    .delete()
    .eq('item_id', item_id)
    .eq('product_id', product_id)
  if (error) throw error
}

export async function setDefaultProduct(itemProductId, isDefault) {
  const { data, error } = await supabase
    .from('sched_item_products')
    .update({ is_default: isDefault })
    .eq('id', itemProductId)
    .select()
    .single()
  if (error) throw error
  return data
}
