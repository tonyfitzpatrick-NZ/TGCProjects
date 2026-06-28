// ============================================================
// src/lib/specQueries.js
// Queries for the Specification Builder — a distinct feature
// from the Schedule of Finishes module (see scheduleQueries.js),
// even though it reads from some of the same underlying tables
// (sched_items, sched_products, sched_project_selections) when
// it comes time to actually generate a specification.
//
// This file covers:
//   - spec_cbi_categories  (CBI prefix -> NZBC clause reference)
//   - spec_core_sections   (TGC's own boilerplate sections)
//   - spec_project_sections (per-project on/off overrides)
// ============================================================

import { supabase } from './supabase'

// ── CBI categories (CBI prefix -> typical NZBC clauses) ───────

export async function fetchCbiCategories() {
  const { data, error } = await supabase
    .from('spec_cbi_categories')
    .select('*')
    .order('cbi_prefix')
  if (error) throw error
  return data || []
}

export async function createCbiCategory({ cbi_prefix, category_label, nzbc_clauses }) {
  const { data, error } = await supabase
    .from('spec_cbi_categories')
    .insert({ cbi_prefix, category_label, nzbc_clauses: nzbc_clauses || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCbiCategory(id, updates) {
  const { data, error } = await supabase
    .from('spec_cbi_categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCbiCategory(id) {
  const { error } = await supabase.from('spec_cbi_categories').delete().eq('id', id)
  if (error) throw error
}

// ── Core sections (TGC's boilerplate, organised by CBI code) ──

export async function fetchCoreSections() {
  const { data, error } = await supabase
    .from('spec_core_sections')
    .select('*')
    .order('sort_order')
    .order('cbi_code')
  if (error) throw error
  return data || []
}

export async function createCoreSection({ cbi_code, title, body, is_default_included, sort_order }) {
  const { data, error } = await supabase
    .from('spec_core_sections')
    .insert({
      cbi_code: cbi_code || null,
      title,
      body,
      is_default_included: is_default_included !== false,
      sort_order: sort_order || 0,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCoreSection(id, updates) {
  const { data, error } = await supabase
    .from('spec_core_sections')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCoreSection(id) {
  const { error } = await supabase.from('spec_core_sections').delete().eq('id', id)
  if (error) throw error
}

// ── Per-project section overrides ──────────────────────────────
// A project only has rows in spec_project_sections for sections
// where the user has explicitly toggled something AWAY from the
// template's own is_default_included value. Sections with no
// override row simply use the template's default — this keeps
// the override table small and means a newly-added core section
// automatically applies its sensible default to every existing
// project without needing a row inserted everywhere.

export async function fetchProjectSectionOverrides(projectId) {
  const { data, error } = await supabase
    .from('spec_project_sections')
    .select('*')
    .eq('project_id', projectId)
  if (error) throw error
  // Map keyed by core_section_id for easy lookup
  return Object.fromEntries((data || []).map(r => [r.core_section_id, r]))
}

export async function setProjectSectionIncluded({ projectId, coreSectionId, included }) {
  const { data, error } = await supabase
    .from('spec_project_sections')
    .upsert(
      { project_id: projectId, core_section_id: coreSectionId, included },
      { onConflict: 'project_id,core_section_id' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

// Convenience: given the template list + override map, resolve
// the actual included/excluded state for each core section on a
// specific project. Used by both the per-project toggle UI and
// (later) the generation engine itself, so the two can never
// disagree about what's actually included.
export function resolveSectionInclusion(coreSections, overridesMap) {
  return coreSections.map(section => ({
    ...section,
    included: overridesMap[section.id]?.included ?? section.is_default_included,
  }))
}
