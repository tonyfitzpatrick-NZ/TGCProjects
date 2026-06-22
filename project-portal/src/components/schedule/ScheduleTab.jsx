// ============================================================
// src/components/schedule/ScheduleTab.jsx
// Main schedule of finishes tab.
// Props:
//   projectId — uuid of the current project
//   userRole  — 'admin' | 'lead' | 'consultant'
//
// Multi-select update:
//   - An item can have MULTIPLE products selected (e.g. Entry
//     Door needs both a Door and a Door Lock), each with its
//     own independent status/note/confirm.
//   - The picker is now a checklist (toggle any number of
//     products on/off) instead of a single-choice radio list.
//   - Each selected product shows as its own row below the
//     picker, with its own status badge, note field, and
//     confirm/unlock controls.
// ============================================================

import { useState, useMemo } from 'react'
import { Search, Loader, CheckCircle, ExternalLink, Plus, X } from 'lucide-react'
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
    deselectProduct,
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
                      itemSelections={selections[item.id] || []}
                      canEdit={canEdit}
                      onSelectProduct={selectProduct}
                      onDeselectProduct={deselectProduct}
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
// Shows a checklist of assignable products (toggle any number
// on/off), and below it, one expandable row per currently
// selected product with its own status/note/confirm.

function ItemRow({ item, itemSelections, canEdit, onSelectProduct, onDeselectProduct, onUpdateNote, onConfirm }) {
  const [open, setOpen] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const selectedIds = itemSelections.map(s => s.product_id)
  const allConfirmed = itemSelections.length > 0 && itemSelections.every(s => s.status === 'confirmed')
  const anyConfirmed = itemSelections.some(s => s.status === 'confirmed')

  // Overall badge for the collapsed row: confirmed only if every
  // selected product is confirmed; otherwise show count selected.
  const overallStatus = itemSelections.length === 0
    ? 'tbc'
    : allConfirmed ? 'confirmed' : 'specified'
  const sc = STATUS_COLORS[overallStatus] || STATUS_COLORS.tbc

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: '9px', overflow: 'hidden' }}>

      {/* Collapsed row */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '11px 14px', cursor: 'pointer',
          background: allConfirmed ? '#F6FBF9' : '#fff',
        }}>

        {/* Item name */}
        <div style={{ flex: '0 0 200px', minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{item.name}</div>
          {item.description && (
            <div style={{ fontSize: '11px', color: '#aaa' }}>{item.description}</div>
          )}
        </div>

        {/* Selected products preview */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {itemSelections.length === 0 ? (
            <span style={{ fontSize: '12px', color: '#ccc' }}>Not selected</span>
          ) : (
            <div style={{ fontSize: '12px', color: '#444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {itemSelections.map(s => s.sched_products?.name).filter(Boolean).join(' + ')}
            </div>
          )}
        </div>

        {/* Status badge */}
        <span style={{ flexShrink: 0, fontSize: '11px', fontWeight: '500', padding: '3px 9px', borderRadius: '20px', background: sc.bg, color: sc.color }}>
          {itemSelections.length === 0
            ? 'TBC'
            : allConfirmed
              ? 'Confirmed'
              : `${itemSelections.filter(s => s.status === 'confirmed').length}/${itemSelections.length} confirmed`}
        </span>

        {allConfirmed && <CheckCircle size={14} color="#1D9E75" style={{ flexShrink: 0 }} />}

        <span style={{ color: '#ccc', flexShrink: 0 }}>{open ? '▾' : '▸'}</span>
      </div>

      {/* Expanded panel */}
      {open && (
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: '14px 16px', background: '#FAFAF8', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Currently selected products — each its own row */}
          {itemSelections.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {itemSelections.map(sel => (
                <SelectedProductCard
                  key={sel.product_id}
                  item={item}
                  selection={sel}
                  canEdit={canEdit}
                  onDeselect={() => onDeselectProduct(item.id, sel.product_id)}
                  onUpdateNote={note => onUpdateNote(item.id, sel.product_id, note)}
                  onConfirm={() => onConfirm(item.id, sel.product_id)}
                />
              ))}
            </div>
          )}

          {/* Add product picker — editable only */}
          {canEdit && (
            <div>
              {!showPicker ? (
                <button
                  onClick={() => setShowPicker(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: 'transparent', border: `1px dashed #D0CEC6`, borderRadius: '8px', fontSize: '12px', color: NAVY, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Plus size={12} /> {itemSelections.length > 0 ? 'Add another product' : 'Select product'}
                </button>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <SectionLabel>Choose product(s) for this item</SectionLabel>
                    <button onClick={() => setShowPicker(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}>
                      <X size={13} />
                    </button>
                  </div>
                  {item.assignedProducts.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#ccc' }}>
                      No products assigned to this item. Add them via Admin → Schedule Library.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {item.assignedProducts.map(ip => {
                        const p = ip.sched_products
                        const isSelected = selectedIds.includes(ip.product_id)
                        return (
                          <button
                            key={ip.id}
                            onClick={() => isSelected ? onDeselectProduct(item.id, ip.product_id) : onSelectProduct(item.id, ip.product_id)}
                            style={{
                              display: 'flex', alignItems: 'flex-start', gap: '10px',
                              padding: '10px 12px', textAlign: 'left', fontFamily: 'inherit',
                              border: `2px solid ${isSelected ? NAVY : BORDER}`,
                              borderRadius: '8px',
                              background: isSelected ? '#EEF1F6' : '#fff',
                              cursor: 'pointer',
                            }}>
                            {/* Checkbox (not radio — multiple can be selected) */}
                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${isSelected ? NAVY : '#D0CEC6'}`, background: isSelected ? NAVY : '#fff', flexShrink: 0, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isSelected && <CheckCircle size={11} color="#fff" style={{ strokeWidth: 3 }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{p?.name}</div>
                              {p?.manufacturer && <div style={{ fontSize: '11px', color: '#888' }}>{p.manufacturer}</div>}
                              {ip.is_default && (
                                <span style={{ fontSize: '10px', background: '#F0E8D0', color: '#7A5C10', padding: '1px 6px', borderRadius: '10px', fontWeight: '500', marginTop: '4px', display: 'inline-block' }}>
                                  Default
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {itemSelections.length === 0 && !canEdit && (
            <div style={{ fontSize: '12px', color: '#ccc' }}>No product selected yet.</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── One selected product's own card (status/note/confirm) ──────

function SelectedProductCard({ item, selection, canEdit, onDeselect, onUpdateNote, onConfirm }) {
  const [note,   setNote]   = useState(selection.project_note || '')
  const [saving, setSaving] = useState(false)

  const product = selection.sched_products
  const status = selection.status || 'specified'
  const isConfirmed = status === 'confirmed'
  const sc = STATUS_COLORS[status] || STATUS_COLORS.specified

  async function handleSaveNote() {
    setSaving(true)
    await onUpdateNote(note)
    setSaving(false)
  }

  return (
    <div style={{ background: isConfirmed ? '#E6F5EF' : '#fff', border: `1px solid ${isConfirmed ? '#BFE6D5' : BORDER}`, borderRadius: '8px', padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: isConfirmed ? '#0F6E56' : '#1a1a1a' }}>
              {isConfirmed && '✓ '}{product?.name}
            </span>
            <span style={{ fontSize: '10px', fontWeight: '500', padding: '2px 8px', borderRadius: '20px', background: sc.bg, color: sc.color }}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          {product?.manufacturer && (
            <div style={{ fontSize: '12px', color: isConfirmed ? '#0F6E56' : '#888', marginTop: '2px' }}>{product.manufacturer}</div>
          )}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '6px' }}>
            {product?.url_website         && <DocLink href={product.url_website}         label="Website" />}
            {product?.url_branz_appraisal && <DocLink href={product.url_branz_appraisal} label="BRANZ" />}
            {product?.url_codemark        && <DocLink href={product.url_codemark}         label="CodeMark" />}
            {product?.url_install_manual  && <DocLink href={product.url_install_manual}   label="Install Manual" />}
          </div>
        </div>

        {canEdit && !isConfirmed && (
          <button onClick={onDeselect} title="Remove this product from the item"
                  style={{ background: 'none', border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', color: '#bbb', flexShrink: 0 }}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* Note */}
      {canEdit && !isConfirmed && (
        <div style={{ marginTop: '10px' }}>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a project-specific note or substitution detail…"
            style={{ width: '100%', padding: '8px 10px', border: `1px solid #D0CEC6`, borderRadius: '7px', fontSize: '12px', fontFamily: 'inherit', resize: 'vertical', minHeight: '50px', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              onClick={handleSaveNote}
              disabled={saving || note === (selection.project_note || '')}
              style={{ padding: '5px 12px', background: '#fff', color: NAVY, border: `1px solid ${BORDER}`, borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', opacity: (saving || note === (selection.project_note || '')) ? 0.5 : 1 }}>
              {saving ? 'Saving…' : 'Save note'}
            </button>
            <button
              onClick={onConfirm}
              style={{ padding: '5px 14px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}>
              ✓ Confirm
            </button>
          </div>
        </div>
      )}

      {!canEdit && selection.project_note && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#444', background: '#fff', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${BORDER}` }}>
          {selection.project_note}
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
    <div style={{ fontSize: '11px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </div>
  )
}
