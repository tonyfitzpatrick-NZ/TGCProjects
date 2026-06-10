// ============================================================
// scheduleQueries.js
// All Supabase queries for the schedule of finishes module.
// Import supabase from your existing src/lib/supabase.js
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

// ── Master data ──────────────────────────────────────────────

export async function fetchSections() {
  const { data, error } = await supabase
    .from('sched_sections')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data
}

export async function fetchItems() {
  const { data, error } = await supabase
    .from('sched_items')
    .select(`
      *,
      sched_item_options (*)
    `)
    .order('sort_order')
  if (error) throw error
  return data
}

export async function fetchTemplates() {
  const { data, error } = await supabase
    .from('sched_templates')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data
}

export async function fetchOptionDocs(optionId) {
  const { data, error } = await supabase
    .from('sched_option_docs')
    .select('*')
    .eq('option_id', optionId)
    .order('doc_type')
  if (error) throw error
  return data
}

// ── Project schedule ─────────────────────────────────────────

export async function fetchProjectSchedule(projectId) {
  const { data, error } = await supabase
    .from('v_sched_project')
    .select('*')
    .eq('project_id', projectId)
    .order('section_order')
  if (error) throw error
  return data
}

export async function fetchProjectSelections(projectId) {
  const { data, error } = await supabase
    .from('sched_project_selections')
    .select('*')
    .eq('project_id', projectId)
  if (error) throw error
  // Return as a map keyed by item_id for easy lookup
  return Object.fromEntries((data || []).map(s => [s.item_id, s]))
}

export async function upsertSelection({ projectId, itemId, optionId, status, projectNote }) {
  const { data, error } = await supabase
    .from('sched_project_selections')
    .upsert(
      {
        project_id: projectId,
        item_id: itemId,
        option_id: optionId || null,
        status: status || 'specified',
        project_note: projectNote || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'project_id,item_id' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

export async function applyTemplate(projectId, templateId) {
  // Update the project's template reference
  const { error } = await supabase
    .from('projects')
    .update({ sched_template_id: templateId, sched_stage: 'design' })
    .eq('id', projectId)
  if (error) throw error
}

// ── Admin: manage master data ────────────────────────────────

export async function addItemOption({ itemId, label, detail, warranty, supplier, modelRef }) {
  const { data, error } = await supabase
    .from('sched_item_options')
    .insert({
      item_id: itemId,
      label,
      detail,
      warranty: warranty || '',
      supplier: supplier || '',
      model_ref: modelRef || '',
      is_default: false,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateItemOption(optionId, updates) {
  const { data, error } = await supabase
    .from('sched_item_options')
    .update(updates)
    .eq('id', optionId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteItemOption(optionId) {
  const { error } = await supabase
    .from('sched_item_options')
    .delete()
    .eq('id', optionId)
  if (error) throw error
}

export async function addOptionDoc({ optionId, docType, title, url }) {
  const { data, error } = await supabase
    .from('sched_option_docs')
    .insert({
      option_id: optionId,
      doc_type: docType,
      title,
      url,
      fetched_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteOptionDoc(docId) {
  const { error } = await supabase
    .from('sched_option_docs')
    .delete()
    .eq('id', docId)
  if (error) throw error
}
