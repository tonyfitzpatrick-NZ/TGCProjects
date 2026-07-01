// ============================================================
// src/components/schedule/ScheduleTab.jsx
// Full updated version with PDF Generation via Netlify Function
// ============================================================

import { useState, useMemo } from 'react'
import { Search, Loader, CheckCircle, ExternalLink, Plus, X, Lock } from 'lucide-react'
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
    updateStatus,
    confirmSelection,
  } = useSchedule(projectId)

  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState({})
  const [generatingSpec, setGeneratingSpec] = useState(false)

  // Toast system
  const [toast, setToast] = useState(null)

  const canEdit = userRole === 'admin' || userRole === 'lead'

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ==================== GENERATE SPECIFICATION ====================
  const handleGenerateSpecification = async () => {
    if (!projectId) {
      showToast('No project selected', 'error')
      return
    }

    setGeneratingSpec(true)

    try {
      const response = await fetch('/.netlify/functions/generate-specification-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate specification PDF')
      }

      showToast('Specification PDF generated successfully!', 'success')

      // Auto download the PDF
      const link = document.createElement('a')
      link.href = result.url
      link.download = `Specification-${projectId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (err) {
      console.error('PDF Generation Error:', err)
      showToast('Failed to generate PDF: ' + err.message, 'error')
    } finally {
      setGeneratingSpec(false)
    }
  }

  // ==================== FILTERED + TOGGLE ====================
  const filtered = useMemo(() => {
    if (!search.trim()) return itemsByGroup
    const q = search.toLowerCase()
    return itemsByGroup
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.name.toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q) ||
          (item.cbi_code || '').toLowerCase().includes(q) ||
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

  if (itemsByGroup.length === 0 && !error) return (
    <div style={{ padding: '60px', textAlign: 'center', color: '#ccc', fontSize: '14px' }}>
      No schedule items set up yet. An admin can add groups and items via the Schedule Library.
    </div>
  )

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toast.type === 'success' ? '#E6F5EF' : '#FAECE7',
          color: toast.type === 'success' ? '#0F6E56' : '#993C1D',
          padding: '14px 20px', borderRadius: '10px',
          border: `1px solid ${toast.type === 'success' ? '#BFE6D5' : '#F5C6B0'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '400px',
          fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          {toast.type === 'success' && <CheckCircle size={18} />}
          <span style={{ flex: 1 }}>{toast.message}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div style={{
          padding: '10px 14px', background: '#FAECE7', color: '#993C1D',
          borderRadius: '8px', marginBottom: '16px', fontSize: '12px',
          fontFamily: 'monospace', lineHeight: '1.6', wordBreak: 'break-word'
        }}>
          {error}
        </div>
      )}

      {/* Stats bar + Generate Specification button */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Total', value: stats.total, color: '#888' },
            { label: 'Confirmed', value: stats.confirmed, color: '#1D9E75' },
            { label: 'Specified', value: stats.specified, color: NAVY },
            { label: 'TBC', value: stats.tbc, color: GOLD },
          ].map(s => (
            <div key={s.label} style={{ padding: '10px 16px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '10px', textAlign: 'center', minWidth: '80px' }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}

          <div style={{ flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '6px', background: '#ECEAE4', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${stats.pct}%`, height: '100%', background: '#1D9E75', borderRadius: '3px', transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: '12px', color: '#888', flexShrink: 0 }}>{stats.pct}% confirmed</span>
          </div>
        </div>

        {/* Generate Specification Button */}
        {canEdit && (
          <button
            onClick={handleGenerateSpecification}
            disabled={generatingSpec}
            style={{
              padding: '10px 18px', background: NAVY, color: '#fff',
              border: 'none', borderRadius: '8px', fontSize: '13px',
              fontWeight: '600', cursor: generatingSpec ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              opacity: generatingSpec ? 0.7 : 1,
            }}
          >
            {generatingSpec ? (
              <>Generating… <Loader size={16} /></>
            ) : (
              'Generate Specification'
            )}
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '480px' }}>
        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }} />
        <input
          placeholder="Search items, CBI codes, or products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '9px 12px 9px 34px', border: `1px solid #D0CEC6`, borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit', background: '#fff', outline: 'none' }}
        />
      </div>

      {saving && (
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Loader size={12} /> Saving…
        </div>
      )}

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
              <button
                onClick={() => toggleGroup(group.id)}
                style={{ width: '100%', padding: '13px 16px', textAlign: 'left', background: '#F7F6F3', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'inherit' }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: NAVY, flex: 1 }}>{group.name}</span>
                {group.description && <span style={{ fontSize: '12px', color: '#aaa' }}>{group.description}</span>}
                <span style={{ fontSize: '12px', color: '#aaa' }}>{group.items.length} items</span>
                <span style={{ color: '#aaa' }}>{isOpen ? '▾' : '▸'}</span>
              </button>

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
                      onUpdateStatus={updateStatus}
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

// ── ItemRow Component ───────────────────────────────────────────
function ItemRow({ item, itemSelections, canEdit, onSelectProduct, onDeselectProduct, onUpdateNote, onUpdateStatus, onConfirm }) {
  const [open, setOpen] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const selectedIds = itemSelections.map(s => s.product_id)
  const allConfirmed = itemSelections.length > 0 && itemSelections.every(s => s.status === 'confirmed')

  const overallStatus = itemSelections.length === 0
    ? 'tbc'
    : allConfirmed ? 'confirmed' : 'specified'
  const sc = STATUS_COLORS[overallStatus] || STATUS_COLORS.tbc

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: '9px', overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '11px 14px', cursor: 'pointer',
          background: allConfirmed ? '#F6FBF9' : '#fff',
        }}>

        <div style={{ flex: '0 0 200px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{item.name}</span>
            {item.cbi_code && (
              <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#7A5C10', background: '#F0E8D0', padding: '1px 5px', borderRadius: '3px' }}>
                {item.cbi_code}
              </span>
            )}
          </div>
          {item.description && <div style={{ fontSize: '11px', color: '#aaa' }}>{item.description}</div>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {itemSelections.length === 0 ? (
            <span style={{ fontSize: '12px', color: '#ccc' }}>Not selected</span>
          ) : (
            <div style={{ fontSize: '12px', color: '#444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {itemSelections.map(s => s.sched_products?.name).filter(Boolean).join(' + ')}
            </div>
          )}
        </div>

        <span style={{ flexShrink: 0, fontSize: '11px', fontWeight: '500', padding: '3px 9px', borderRadius: '20px', background: sc.bg, color: sc.color }}>
          {itemSelections.length === 0 ? 'TBC' : allConfirmed ? 'Confirmed' : `${itemSelections.filter(s => s.status === 'confirmed').length}/${itemSelections.length} confirmed`}
        </span>

        {allConfirmed && <CheckCircle size={14} color="#1D9E75" style={{ flexShrink: 0 }} />}
        <span style={{ color: '#ccc', flexShrink: 0 }}>{open ? '▾' : '▸'}</span>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: '14px 16px', background: '#FAFAF8', display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                  onUpdateStatus={newStatus => onUpdateStatus(item.id, sel.product_id, newStatus)}
                  onConfirm={() => onConfirm(item.id, sel.product_id)}
                />
              ))}
            </div>
          )}

          {canEdit && (
            <div>
              {!showPicker ? (
                <button onClick={() => setShowPicker(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: 'transparent', border: `1px dashed #D0CEC6`, borderRadius: '8px', fontSize: '12px', color: NAVY, cursor: 'pointer' }}>
                  <Plus size={12} /> {itemSelections.length > 0 ? 'Add another product' : 'Select product'}
                </button>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#888', textTransform: 'uppercase' }}>Choose product(s)</div>
                    <button onClick={() => setShowPicker(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}><X size={13} /></button>
                  </div>
                  {item.assignedProducts.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#ccc' }}>No products assigned. Add via Schedule Library.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {item.assignedProducts.map(ip => {
                        const p = ip.sched_products
                        const isSelected = selectedIds.includes(ip.product_id)
                        return (
                          <button key={ip.id} onClick={() => isSelected ? onDeselectProduct(item.id, ip.product_id) : onSelectProduct(item.id, ip.product_id)}
                            style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px', border: `2px solid ${isSelected ? NAVY : BORDER}`, borderRadius: '8px', background: isSelected ? '#EEF1F6' : '#fff', cursor: 'pointer' }}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${isSelected ? NAVY : '#D0CEC6'}`, background: isSelected ? NAVY : '#fff' }} />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '500' }}>{p?.name}</div>
                              {p?.manufacturer && <div style={{ fontSize: '11px', color: '#888' }}>{p.manufacturer}</div>}
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
        </div>
      )}
    </div>
  )
}

// ── SelectedProductCard ─────────────────────────────────────────
function SelectedProductCard({ item, selection, canEdit, onDeselect, onUpdateNote, onUpdateStatus, onConfirm }) {
  const [note, setNote] = useState(selection.project_note || '')
  const [saving, setSaving] = useState(false)
  const [unlocked, setUnlocked] = useState(false)

  const product = selection.sched_products
  const status = selection.status || 'specified'
  const isConfirmed = status === 'confirmed'
  const showControls = canEdit && (!isConfirmed || unlocked)
  const sc = STATUS_COLORS[status] || STATUS_COLORS.specified

  async function handleSaveNote() {
    setSaving(true)
    await onUpdateNote(note)
    setSaving(false)
  }

  return (
    <div style={{ background: isConfirmed && !unlocked ? '#E6F5EF' : '#fff', border: `1px solid ${isConfirmed && !unlocked ? '#BFE6D5' : BORDER}`, borderRadius: '8px', padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: isConfirmed && !unlocked ? '#0F6E56' : '#1a1a1a' }}>
              {isConfirmed && '✓ '}{product?.name}
            </span>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: sc.bg, color: sc.color }}>
              {status}
            </span>
          </div>
          {product?.manufacturer && <div style={{ fontSize: '12px', color: '#888' }}>{product.manufacturer}</div>}
        </div>

        {canEdit && isConfirmed && !unlocked && (
          <button onClick={() => setUnlocked(true)} style={{ fontSize: '11px', padding: '4px 9px', border: `1px solid #BFE6D5`, borderRadius: '6px', color: '#0F6E56' }}>
            Unlock
          </button>
        )}
        {showControls && <button onClick={onDeselect} style={{ color: '#bbb' }}><X size={12} /></button>}
      </div>

      {showControls && (
        <div style={{ marginTop: '10px' }}>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add note..." style={{ width: '100%', padding: '8px', border: `1px solid #D0CEC6`, borderRadius: '7px', minHeight: '50px' }} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button onClick={handleSaveNote} disabled={saving} style={{ padding: '5px 12px', border: `1px solid ${BORDER}`, borderRadius: '6px' }}>
              {saving ? 'Saving…' : 'Save note'}
            </button>
            {!isConfirmed && <button onClick={onConfirm} style={{ padding: '5px 14px', background: '#1D9E75', color: '#fff', borderRadius: '6px' }}>✓ Confirm</button>}
          </div>
        </div>
      )}
    </div>
  )
}