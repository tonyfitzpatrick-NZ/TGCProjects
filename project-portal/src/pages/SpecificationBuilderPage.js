// ============================================================
// src/pages/SpecificationBuilderPage.js
// Admin screen for the Specification Builder foundations:
//   - CBI Categories: maps CBI prefixes to their typical NZBC
//     compliance clauses (used later by the generation engine)
//   - Core Sections: TGC's own boilerplate text, organised by
//     CBI code, with a default on/off state per project
//
// This is step 2 of the Specification Builder — the actual
// per-project generation screen and Word/PDF export come later.
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Plus, Trash2, Edit2, X, ChevronDown, ChevronRight } from 'lucide-react'
import {
  fetchCbiCategories, createCbiCategory, updateCbiCategory, deleteCbiCategory,
  fetchCoreSections, createCoreSection, updateCoreSection, deleteCoreSection,
} from '../lib/specQueries'

const NAVY = '#1B2B4B'
const GOLD = '#B8952A'
const BORDER = '#ECEAE4'

const TABS = [
  { id: 'core-sections', label: 'Core Sections' },
  { id: 'cbi-categories', label: 'CBI Categories' },
]

export default function SpecificationBuilderPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const [tab, setTab] = useState('core-sections')

  if (!isAdmin) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
        Admin access required.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 24px', borderBottom: '0.5px solid #ECEAE4', background: '#fff' }}>
        <h1 style={{ fontSize: '17px', fontWeight: '600', color: NAVY, margin: 0, letterSpacing: '-0.02em' }}>
          Specification Builder
        </h1>
        <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
          Manage core sections and CBI/NZBC reference data used to generate project specifications
        </div>
      </div>

      <div style={{ padding: '0 24px', borderBottom: `1px solid ${BORDER}`, background: '#fff' }}>
        <div style={{ display: 'flex' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 22px', border: 'none', background: 'transparent',
                fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer',
                fontWeight: tab === t.id ? '600' : '400',
                color: tab === t.id ? NAVY : '#888',
                borderBottom: `2px solid ${tab === t.id ? GOLD : 'transparent'}`,
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {tab === 'core-sections' ? <CoreSectionsTab /> : <CbiCategoriesTab />}
      </div>
    </div>
  )
}

// ── Core Sections tab ────────────────────────────────────────

function CoreSectionsTab() {
  const [sections, setSections] = useState([])
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)
  const [expanded, setExpanded] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try { setSections(await fetchCoreSections()) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const EMPTY = { cbi_code: '', title: '', body: '', is_default_included: true, sort_order: sections.length }

  async function saveSection() {
    if (!editing?.title?.trim() || !editing?.body?.trim()) return
    setSaving(true)
    try {
      if (editing.id) {
        await updateCoreSection(editing.id, {
          cbi_code: editing.cbi_code || null,
          title: editing.title,
          body: editing.body,
          is_default_included: !!editing.is_default_included,
          sort_order: Number(editing.sort_order) || 0,
        })
      } else {
        await createCoreSection(editing)
      }
      setEditing(null)
      await load()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete core section "${title}"? This will remove it from every project that included it.`)) return
    try { await deleteCoreSection(id); await load() }
    catch (e) { setError(e.message) }
  }

  if (loading) return <LoadingMsg />

  return (
    <div>
      {error && <ErrorMsg msg={error} onClose={() => setError(null)} />}

      <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', marginBottom: '16px', maxWidth: '640px' }}>
        Write your standard boilerplate sections here once — things like general conditions or
        preliminary requirements that apply to most projects. Each can be toggled on or off for
        a specific project later. Organise them by CBI code so they slot into the right place
        in the generated specification, alongside the auto-generated product sections.
      </p>

      <button onClick={() => setEditing({ ...EMPTY })} style={btnPrimary}>
        <Plus size={13} /> Add core section
      </button>

      {editing && !editing.id && (
        <div style={{ marginTop: '14px' }}>
          <SectionForm value={editing} onChange={setEditing} onSave={saveSection} onCancel={() => setEditing(null)} saving={saving} />
        </div>
      )}

      {sections.length === 0 && !editing && (
        <EmptyMsg>No core sections yet. Add your first one above — try uploading or pasting in your standard general conditions wording to get started.</EmptyMsg>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
        {sections.map(section => {
          const isOpen = !!expanded[section.id]
          if (editing?.id === section.id) {
            return <SectionForm key={section.id} value={editing} onChange={setEditing} onSave={saveSection} onCancel={() => setEditing(null)} saving={saving} />
          }
          return (
            <div key={section.id} style={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', cursor: 'pointer' }}
                   onClick={() => setExpanded(e => ({ ...e, [section.id]: !e[section.id] }))}>
                <span style={{ color: '#aaa' }}>{isOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}</span>
                {section.cbi_code && (
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#7A5C10', background: '#F0E8D0', padding: '1px 6px', borderRadius: '4px', flexShrink: 0 }}>
                    {section.cbi_code}
                  </span>
                )}
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', flex: 1 }}>{section.title}</span>
                <span style={{
                  fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: '500',
                  background: section.is_default_included ? '#E1F5EE' : '#F0EFEF',
                  color: section.is_default_included ? '#0F6E56' : '#999',
                }}>
                  {section.is_default_included ? 'Included by default' : 'Off by default'}
                </span>
                <IconBtn icon={<Edit2 size={13}/>} onClick={e => { e.stopPropagation(); setEditing({ ...section }) }} title="Edit" />
                <IconBtn icon={<Trash2 size={13}/>} onClick={e => { e.stopPropagation(); handleDelete(section.id, section.title) }} title="Delete" danger />
              </div>
              {isOpen && (
                <div style={{ borderTop: `1px solid ${BORDER}`, padding: '14px', background: '#FAFAF8', fontSize: '13px', color: '#444', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                  {section.body}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SectionForm({ value, onChange, onSave, onCancel, saving }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#EEF1F6', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input autoFocus placeholder="Section title *" value={value.title} onChange={e => onChange(v => ({ ...v, title: e.target.value }))} style={{ ...inputStyle, flex: 2 }} />
        <input placeholder="CBI code (optional)" value={value.cbi_code || ''} onChange={e => onChange(v => ({ ...v, cbi_code: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
      </div>
      <textarea
        placeholder="Section wording *"
        value={value.body}
        onChange={e => onChange(v => ({ ...v, body: e.target.value }))}
        style={{ ...inputStyle, minHeight: '160px', resize: 'vertical', lineHeight: '1.6' }}
      />
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#444', cursor: 'pointer' }}>
        <input type="checkbox" checked={value.is_default_included !== false} onChange={e => onChange(v => ({ ...v, is_default_included: e.target.checked }))} />
        Included by default on new projects (can still be toggled off per project)
      </label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onSave} disabled={saving || !value.title?.trim() || !value.body?.trim()} style={btnSave}>
          {saving ? 'Saving…' : value.id ? 'Save changes' : 'Add section'}
        </button>
        <button onClick={onCancel} style={btnCancel}>Cancel</button>
      </div>
    </div>
  )
}

// ── CBI Categories tab ───────────────────────────────────────

function CbiCategoriesTab() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [editing, setEditing]       = useState(null)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setCategories(await fetchCbiCategories()) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const EMPTY = { cbi_prefix: '', category_label: '', nzbc_clauses: '' }

  async function saveCategory() {
    if (!editing?.cbi_prefix?.trim() || !editing?.category_label?.trim()) return
    setSaving(true)
    try {
      if (editing.id) {
        await updateCbiCategory(editing.id, {
          cbi_prefix: editing.cbi_prefix,
          category_label: editing.category_label,
          nzbc_clauses: editing.nzbc_clauses || null,
        })
      } else {
        await createCbiCategory(editing)
      }
      setEditing(null)
      await load()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id, label) {
    if (!window.confirm(`Delete CBI category "${label}"?`)) return
    try { await deleteCbiCategory(id); await load() }
    catch (e) { setError(e.message) }
  }

  if (loading) return <LoadingMsg />

  return (
    <div>
      {error && <ErrorMsg msg={error} onClose={() => setError(null)} />}

      <p style={{ fontSize: '13px', color: '#666', lineHeight: '1.6', marginBottom: '16px', maxWidth: '640px' }}>
        Maps a CBI code prefix to the NZ Building Code clauses typically relevant to that
        category — used later to add a compliance reference when generating each product's
        specification clause. Pre-populated with common categories; edit or add to this as needed.
      </p>

      <button onClick={() => setEditing({ ...EMPTY })} style={btnPrimary}>
        <Plus size={13} /> Add category
      </button>

      {editing && !editing.id && (
        <div style={{ marginTop: '14px' }}>
          <CategoryForm value={editing} onChange={setEditing} onSave={saveCategory} onCancel={() => setEditing(null)} saving={saving} />
        </div>
      )}

      {categories.length === 0 && !editing && (
        <EmptyMsg>No CBI categories yet.</EmptyMsg>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
        {categories.map(cat => (
          editing?.id === cat.id
            ? <CategoryForm key={cat.id} value={editing} onChange={setEditing} onSave={saveCategory} onCancel={() => setEditing(null)} saving={saving} />
            : (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', border: `1px solid ${BORDER}`, borderRadius: '9px', background: '#fff' }}>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#7A5C10', background: '#F0E8D0', padding: '2px 7px', borderRadius: '4px', flexShrink: 0, marginTop: '1px' }}>
                  {cat.cbi_prefix}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{cat.category_label}</div>
                  {cat.nzbc_clauses && <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{cat.nzbc_clauses}</div>}
                </div>
                <IconBtn icon={<Edit2 size={13}/>} onClick={() => setEditing({ ...cat })} title="Edit" />
                <IconBtn icon={<Trash2 size={13}/>} onClick={() => handleDelete(cat.id, cat.category_label)} title="Delete" danger />
              </div>
            )
        ))}
      </div>
    </div>
  )
}

function CategoryForm({ value, onChange, onSave, onCancel, saving }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#EEF1F6', borderRadius: '9px', padding: '14px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input autoFocus placeholder="CBI prefix * (e.g. 4521)" value={value.cbi_prefix} onChange={e => onChange(v => ({ ...v, cbi_prefix: e.target.value }))} style={{ ...inputStyle, width: '160px' }} />
        <input placeholder="Category label *" value={value.category_label} onChange={e => onChange(v => ({ ...v, category_label: e.target.value }))} style={{ ...inputStyle, flex: 1 }} />
      </div>
      <input placeholder="NZBC clauses (e.g. B2 Durability, E2 External Moisture)" value={value.nzbc_clauses || ''} onChange={e => onChange(v => ({ ...v, nzbc_clauses: e.target.value }))} style={inputStyle} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onSave} disabled={saving || !value.cbi_prefix?.trim() || !value.category_label?.trim()} style={btnSave}>
          {saving ? 'Saving…' : value.id ? 'Save changes' : 'Add category'}
        </button>
        <button onClick={onCancel} style={btnCancel}>Cancel</button>
      </div>
    </div>
  )
}

// ── Shared small components ───────────────────────────────────

function IconBtn({ icon, onClick, title, danger }) {
  return (
    <button onClick={onClick} title={title}
            style={{ background: 'none', border: `1px solid ${danger ? '#fecaca' : BORDER}`, borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', color: danger ? '#dc2626' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </button>
  )
}

function LoadingMsg() {
  return <div style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>Loading…</div>
}

function EmptyMsg({ children }) {
  return <div style={{ padding: '32px', textAlign: 'center', color: '#ccc', fontSize: '13px' }}>{children}</div>
}

function ErrorMsg({ msg, onClose }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#FAECE7', color: '#993C1D', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#993C1D' }}><X size={13}/></button>
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────

const inputStyle = {
  padding: '8px 10px', border: `1px solid #D0CEC6`, borderRadius: '7px',
  fontSize: '13px', fontFamily: 'inherit', outline: 'none', background: '#fff',
  color: '#1a1a1a', width: '100%', boxSizing: 'border-box',
}

const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '7px 14px', background: NAVY, color: '#fff',
  border: 'none', borderRadius: '8px', fontSize: '12px',
  fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
}

const btnSave = {
  padding: '7px 16px', background: NAVY, color: '#fff',
  border: 'none', borderRadius: '7px', fontSize: '13px',
  fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
}

const btnCancel = {
  padding: '7px 16px', background: 'transparent', color: '#666',
  border: `1px solid #D0CEC6`, borderRadius: '7px', fontSize: '13px',
  cursor: 'pointer', fontFamily: 'inherit',
}
