// ============================================================
// src/components/schedule/ScheduleTab.jsx
// Main schedule of finishes tab.
// Props:
//   projectId — uuid of the current project
//   userRole  — 'admin' | 'lead' | 'consultant'
//
// FIXES vs old version:
//   - Uses itemsByGroup (not itemsBySection — didn't exist)
//   - Uses selectProduct (not selectOption)
//   - Uses item.name (not item.label)
//   - Uses item.assignedProducts (not item.options)
//   - Uses product.name (not option.label)
//   - Removed dependency on ScheduleSection/ScheduleItem components
//     (both used old field names — everything is inline here now)
//   - Added stats bar and progress display
//   - Added confirm button and document links
// ============================================================

import { useState, useMemo } from 'react'
import { Search, Loader, CheckCircle, ExternalLink } from 'lucide-react'
import { useSchedule } from '../../hooks/useSchedule'

const NAVY = '#1B2B4B'
const GOLD = '#B8952A'
const BORDER = '#ECEAE4'

const STATUS_COLORS = {
  confirmed:      { bg: '#E6F5EF', color: '#0F6E56' },
  specified:      { bg: '#EEF1F6', color: NAVY },
  substituted:    { bg: '#FFF4E0', color: '#854F0B' },
  tbc:            { bg: '#F5F5F5', color: '#888' },
  not_applicable: { bg: '#F0EFEF', color: '#bbb' },
}

export default function ScheduleTab({ projectId, userRole }) {
  const {
    itemsByGroup,
    selections,
    stats,
    loading,
    error,
    saving,
    selectProduct,
    updateNote,
    confirmSelection,
  } = useSchedule(projectId)

  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState({})

  const canEdit = userRole === 'admin' || userRole === 'lead'

  const filtered = useMemo(() => {
    if (!search.trim()) return itemsByGroup
    const q = search.toLowerCase()
    return itemsByGroup
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.name.toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q) ||
          item.assignedProducts.some(p =>
            (p.sched_products?.name || '').toLowerCase().includes(q) ||
            (p.sched_products?.manufacturer || '').toLowerCase().includes(q)
          )
        ),
      }))
      .filter(g => g.items.length > 0)
  }, [itemsByGroup, search])

  function toggleGroup(id) {
    setExpanded(e => ({ ...e, [id]: e[id] === false ? true : false }))
  }

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px' }}>
      <Loader size={18} /> Loading schedule…
    </div>
  )

  if (error) return (
    <div style={{ padding: '16px', background: '#FAECE7', color: '#993C1D', borderRadius: '10px', fontSize: '13px' }}>
      Error loading schedule: {error}
    </div>
  )

  if (itemsByGroup.length === 0) return (
    <div style={{ padding: '60px', textAlign: 'center', color: '#ccc', fontSize: '14px' }}>
      No schedule items set up yet. An admin can add groups and items via the Schedule Library.
    </div>
  )

  return (
    <div>
      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'Total',     value: stats.total,     color: '#888' },
          { label: 'Confirmed', value: stats.confirmed, color: '#1D9E75' },
          { label: 'Specified', value: stats.specified, color: NAVY },
          { label: 'TBC',       value: stats.tbc,       color: GOLD },
        ].map(s => (
          <div key={s.label} style={{ padding: '10px 16px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', textAlign: 'center', minWidth: '80px' }}>
            <div style={{ fontSize: '22px', fontWeight: '700', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
        {/* Progress bar */}
        <div style={{ flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '6px', background: '#ECEAE4', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${stats.pct}%`, height: '100%', background: '#1D9E75', borderRadius: '3px', transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: '12px', color: '#888', flexShrink: 0 }}>{stats.pct}% confirmed</span>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '480px' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
        <input
          placeholder="Search items or products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '9px 12px 9px 34px', border: `1px solid #D0CEC6`, borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Saving indicator */}
      {saving && (
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Loader size={12} /> Saving…
        </div>
      )}

      {/* No results */}
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#ccc', padding: '40px', fontSize: '14px' }}>
          No items match your search.
        </div>
      )}

      {/* Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(group => {
          const isOpen = expanded[group.id] !== false
          return (
            <div key={group.id} style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden' }}>

              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.id)}
                style={{ width: '100%', padding: '13px 16px', textAlign: 'left', background: '#F7F6F3', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'inherit' }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: NAVY, flex: 1 }}>{group.name}</span>
                {group.description && (
                  <span style={{ fontSize: '12px', color: '#aaa' }}>{group.description}</span>
                )}
                <span style={{ fontSize: '12px', color: '#aaa' }}>
                  {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                </span>
                <span style={{ color: '#aaa' }}>{isOpen ? '▾' : '▸'}</span>
              </button>

              {/* Items */}
              {isOpen && (
                <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {group.items.map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      selection={selections[item.id]}
                      canEdit={canEdit}
                      onSelectProduct={selectProduct}
                      onUpdateNote={updateNote}
                      onConfirm={confirmSelection}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Single item row ───────────────────────────────────────────

function ItemRow({ item, selection, canEdit, onSelectProduct, onUpdateNote, onConfirm }) {
  const [open,   setOpen]   = useState(false)
  const [note,   setNote]   = useState(selection?.project_note || '')
  const [saving, setSaving] = useState(false)

  // Keep note in sync if parent selection changes
  useState(() => { setNote(selection?.project_note || '') }, [selection?.project_note])

  const selectedProductId = selection?.product_id
  const status            = selection?.status || 'tbc'
  const isConfirmed       = status === 'confirmed'
  const sc                = STATUS_COLORS[status] || STATUS_COLORS.tbc

  // Find the selected product object
  const selectedProduct = item.assignedProducts
    .find(p => p.product_id === selectedProductId)?.sched_products

  // Fallback: find default product for display when nothing selected
  const defaultProduct = item.assignedProducts
    .find(p => p.is_default)?.sched_products

  async function handleSaveNote() {
    setSaving(true)
    await onUpdateNote(item.id, note)
    setSaving(false)
  }

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: '9px', overflow: 'hidden' }}>

      {/* Collapsed row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '11px 14px', cursor: 'pointer',
          background: isConfirmed ? '#F6FBF9' : '#fff',
        }}>

        {/* Item name */}
        <div style={{ flex: '0 0 200px', minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{item.name}</div>
          {item.description && (
            <div style={{ fontSize: '11px', color: '#aaa' }}>{item.description}</div>
          )}
        </div>

        {/* Selected/default product preview */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', color: selectedProduct ? '#444' : '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedProduct
              ? <>
                  {selectedProduct.name}
                  {selectedProduct.manufacturer && <span style={{ color: '#aaa' }}> — {selectedProduct.manufacturer}</span>}
                </>
              : defaultProduct
                ? <span style={{ color: '#aaa' }}>{defaultProduct.name} (default)</span>
                : 'Not selected'
            }
          </div>
        </div>

        {/* Status badge */}
        <span style={{ flexShrink: 0, fontSize: '11px', fontWeight: '500', padding: '3px 9px', borderRadius: '20px', background: sc.bg, color: sc.color }}>
          {status === 'not_applicable' ? 'N/A' : status.charAt(0).toUpperCase() + status.slice(1)}
        </span>

        {/* Confirmed tick */}
        {isConfirmed && <CheckCircle size={14} color="#1D9E75" style={{ flexShrink: 0 }} />}

        <span style={{ color: '#ccc', flexShrink: 0 }}>{open ? '▾' : '▸'}</span>
      </div>

      {/* Expanded panel */}
      {open && (
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: '14px 16px', background: '#FAFAF8', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Product picker — editable and not yet confirmed */}
          {canEdit && !isConfirmed && (
            <div>
              <SectionLabel>Select product</SectionLabel>
              {item.assignedProducts.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#ccc' }}>
                  No products assigned to this item. Add them via Admin → Schedule Library.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {item.assignedProducts.map(ip => {
                    const p = ip.sched_products
                    const isSelected = selectedProductId === ip.product_id
                    return (
                      <button
                        key={ip.id}
                        onClick={() => onSelectProduct(item.id, ip.product_id)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: '10px',
                          padding: '10px 12px', textAlign: 'left', fontFamily: 'inherit',
                          border: `2px solid ${isSelected ? NAVY : BORDER}`,
                          borderRadius: '8px',
                          background: isSelected ? '#EEF1F6' : '#fff',
                          cursor: 'pointer',
                        }}>
                        {/* Radio dot */}
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${isSelected ? NAVY : '#D0CEC6'}`, background: isSelected ? NAVY : '#fff', flexShrink: 0, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isSelected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{p?.name}</div>
                          {p?.manufacturer && <div style={{ fontSize: '11px', color: '#888' }}>{p.manufacturer}</div>}
                          {ip.is_default && (
                            <span style={{ fontSize: '10px', background: '#F0E8D0', color: '#7A5C10', padding: '1px 6px', borderRadius: '10px', fontWeight: '500', marginTop: '4px', display: 'inline-block' }}>
                              Default
                            </span>
                          )}
                          {/* Document links */}
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '6px' }}>
                            {p?.url_website         && <DocLink href={p.url_website}         label="Website" />}
                            {p?.url_branz_appraisal && <DocLink href={p.url_branz_appraisal} label="BRANZ" />}
                            {p?.url_codemark        && <DocLink href={p.url_codemark}         label="CodeMark" />}
                            {p?.url_install_manual  && <DocLink href={p.url_install_manual}   label="Install Manual" />}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Confirmed view — read-only product summary */}
          {isConfirmed && selectedProduct && (
            <div style={{ background: '#E6F5EF', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F6E56', marginBottom: '4px' }}>
                ✓ Confirmed: {selectedProduct.name}
              </div>
              {selectedProduct.manufacturer && (
                <div style={{ fontSize: '12px', color: '#0F6E56', marginBottom: '8px' }}>
                  {selectedProduct.manufacturer}
                </div>
              )}
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {selectedProduct.url_website         && <DocLink href={selectedProduct.url_website}         label="Website" />}
                {selectedProduct.url_branz_appraisal && <DocLink href={selectedProduct.url_branz_appraisal} label="BRANZ" />}
                {selectedProduct.url_codemark        && <DocLink href={selectedProduct.url_codemark}         label="CodeMark" />}
                {selectedProduct.url_install_manual  && <DocLink href={selectedProduct.url_install_manual}   label="Install Manual" />}
              </div>
            </div>
          )}

          {/* Project note */}
          {canEdit && (
            <div>
              <SectionLabel>Project note</SectionLabel>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a project-specific note or substitution detail…"
                style={{ width: '100%', padding: '9px 10px', border: `1px solid #D0CEC6`, borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', minHeight: '64px', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
              />
              <button
                onClick={handleSaveNote}
                disabled={saving || note === (selection?.project_note || '')}
                style={{ marginTop: '6px', padding: '6px 14px', background: NAVY, color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', opacity: (saving || note === (selection?.project_note || '')) ? 0.5 : 1 }}>
                {saving ? 'Saving…' : 'Save note'}
              </button>
            </div>
          )}

          {/* Read-only note for consultants */}
          {!canEdit && selection?.project_note && (
            <div>
              <SectionLabel>Project note</SectionLabel>
              <div style={{ fontSize: '13px', color: '#444', background: '#fff', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${BORDER}` }}>
                {selection.project_note}
              </div>
            </div>
          )}

          {/* Confirm button */}
          {canEdit && !isConfirmed && selectedProductId && (
            <div>
              <button
                onClick={() => onConfirm(item.id)}
                style={{ padding: '9px 20px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}>
                ✓ Confirm selection
              </button>
            </div>
          )}

          {/* Unlock confirmed item */}
          {canEdit && isConfirmed && (
            <button
              onClick={() => onSelectProduct(item.id, null)}
              style={{ alignSelf: 'flex-start', padding: '6px 14px', background: 'transparent', color: '#888', border: `1px solid ${BORDER}`, borderRadius: '7px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Unlock to change
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────

function DocLink({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: NAVY, background: '#EEF1F6', padding: '2px 7px', borderRadius: '4px', textDecoration: 'none', fontWeight: '500' }}>
      <ExternalLink size={10} /> {label}
    </a>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: '11px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
      {children}
    </div>
  )
}
