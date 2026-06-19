// ============================================================
// src/components/schedule/ScheduleAdminPanel.jsx
// Admin panel for managing the master Schedule of Finishes
// library: Groups → Items → Products → Assignments.
//
// Works with new schema:
//   sched_groups, sched_items (group_id FK),
//   sched_products, sched_item_products (join table)
//
// Used in two places:
//   1. /admin/schedule  (AdminSchedulePage.jsx) — full page
//   2. Project detail Schedule tab — admin section below main tab
//      (passes itemsByGroup + onOptionsChanged props)
// ============================================================

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronRight } from 'lucide-react'
import {
  fetchGroups,
  fetchItemsWithProducts,
  fetchProducts,
  createGroup, updateGroup, deleteGroup,
  createItem,  updateItem,  deleteItem,
  createProduct, updateProduct, deleteProduct,
  assignProductToItem, removeProductFromItem, setDefaultProduct,
} from '../../lib/scheduleQueries'

const NAVY   = '#1B2B4B'
const GOLD   = '#B8952A'
const BORDER = '#ECEAE4'

// ── Top-level tabs ────────────────────────────────────────────
const TABS = [
  { id: 'groups',   label: 'Groups & Items' },
  { id: 'products', label: 'Products' },
  { id: 'assign',   label: 'Assign Products' },
]

export default function ScheduleAdminPanel() {
  const [tab, setTab] = useState('groups')

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: '24px' }}>
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
              transition: 'all 0.1s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'groups'   && <GroupsTab />}
      {tab === 'products' && <ProductsTab />}
      {tab === 'assign'   && <AssignTab />}
    </div>
  )
}

// ── Groups & Items tab ────────────────────────────────────────

function GroupsTab() {
  const [groups,      setGroups]      = useState([])
  const [items,       setItems]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [expanded,    setExpanded]    = useState({})
  const [editGroup,   setEditGroup]   = useState(null)  // {id?, name, description, sort_order}
  const [editItem,    setEditItem]    = useState(null)  // {id?, group_id, name, description, sort_order}
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [grps, itms] = await Promise.all([fetchGroups(), fetchItemsWithProducts()])
      setGroups(grps)
      setItems(itms)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function toggleGroup(id) {
    setExpanded(e => ({ ...e, [id]: !e[id] }))
  }

  // ── Group CRUD ──────────────────────────────────────────────
  async function saveGroup() {
    if (!editGroup?.name?.trim()) return
    setSaving(true)
    try {
      if (editGroup.id) {
        await updateGroup(editGroup.id, { name: editGroup.name, description: editGroup.description || null, sort_order: Number(editGroup.sort_order) || 0 })
      } else {
        await createGroup({ name: editGroup.name, description: editGroup.description || null, sort_order: Number(editGroup.sort_order) || groups.length })
      }
      setEditGroup(null)
      await load()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteGroup(id, name) {
    if (!window.confirm(`Delete group "${name}"? All items in this group will also be deleted.`)) return
    try { await deleteGroup(id); await load() }
    catch (e) { setError(e.message) }
  }

  // ── Item CRUD ───────────────────────────────────────────────
  async function saveItem() {
    if (!editItem?.name?.trim() || !editItem?.group_id) return
    setSaving(true)
    try {
      if (editItem.id) {
        await updateItem(editItem.id, { name: editItem.name, description: editItem.description || null, sort_order: Number(editItem.sort_order) || 0 })
      } else {
        const groupItems = items.filter(i => i.group_id === editItem.group_id)
        await createItem({ group_id: editItem.group_id, name: editItem.name, description: editItem.description || null, sort_order: Number(editItem.sort_order) || groupItems.length })
      }
      setEditItem(null)
      await load()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteItem(id, name) {
    if (!window.confirm(`Delete item "${name}"?`)) return
    try { await deleteItem(id); await load() }
    catch (e) { setError(e.message) }
  }

  if (loading) return <LoadingMsg />

  return (
    <div>
      {error && <ErrorMsg msg={error} onClose={() => setError(null)} />}

      {/* Add group button */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setEditGroup({ name: '', description: '', sort_order: groups.length })}
          style={btnPrimary}>
          <Plus size={13} /> Add group
        </button>
      </div>

      {/* Group edit form */}
      {editGroup && !editGroup.id && (
        <GroupForm
          value={editGroup}
          onChange={setEditGroup}
          onSave={saveGroup}
          onCancel={() => setEditGroup(null)}
          saving={saving}
        />
      )}

      {groups.length === 0 && !editGroup && (
        <EmptyMsg>No groups yet. Add your first group above.</EmptyMsg>
      )}

      {/* Groups list */}
      {groups.map(group => {
        const groupItems = items.filter(i => i.group_id === group.id)
        const isOpen = !!expanded[group.id]

        return (
          <div key={group.id} style={{ marginBottom: '10px', border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
            {/* Group header */}
            {editGroup?.id === group.id ? (
              <div style={{ padding: '12px 14px', background: '#F7F6F3' }}>
                <GroupForm
                  value={editGroup}
                  onChange={setEditGroup}
                  onSave={saveGroup}
                  onCancel={() => setEditGroup(null)}
                  saving={saving}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: '#F7F6F3', cursor: 'pointer' }}
                   onClick={() => toggleGroup(group.id)}>
                <span style={{ color: '#aaa' }}>{isOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: NAVY }}>{group.name}</div>
                  {group.description && <div style={{ fontSize: '12px', color: '#888' }}>{group.description}</div>}
                </div>
                <span style={{ fontSize: '12px', color: '#aaa' }}>{groupItems.length} {groupItems.length === 1 ? 'item' : 'items'}</span>
                <IconBtn icon={<Edit2 size={13}/>} onClick={e => { e.stopPropagation(); setEditGroup({ id: group.id, name: group.name, description: group.description || '', sort_order: group.sort_order }) }} title="Edit group" />
                <IconBtn icon={<Trash2 size={13}/>} onClick={e => { e.stopPropagation(); handleDeleteGroup(group.id, group.name) }} title="Delete group" danger />
              </div>
            )}

            {/* Items */}
            {isOpen && (
              <div style={{ padding: '8px 14px 14px 28px' }}>
                {groupItems.map(item => (
                  <div key={item.id}>
                    {editItem?.id === item.id ? (
                      <div style={{ marginBottom: '8px' }}>
                        <ItemForm
                          value={editItem}
                          groups={groups}
                          onChange={setEditItem}
                          onSave={saveItem}
                          onCancel={() => setEditItem(null)}
                          saving={saving}
                        />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', marginBottom: '5px', border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{item.name}</div>
                          {item.description && <div style={{ fontSize: '11px', color: '#aaa' }}>{item.description}</div>}
                        </div>
                        <span style={{ fontSize: '11px', color: '#aaa' }}>{item.assignedProducts.length} products</span>
                        <IconBtn icon={<Edit2 size={12}/>} onClick={() => setEditItem({ id: item.id, group_id: item.group_id, name: item.name, description: item.description || '', sort_order: item.sort_order })} title="Edit item" />
                        <IconBtn icon={<Trash2 size={12}/>} onClick={() => handleDeleteItem(item.id, item.name)} title="Delete item" danger />
                      </div>
                    )}
                  </div>
                ))}

                {/* Add item inline */}
                {editItem?.group_id === group.id && !editItem.id ? (
                  <ItemForm
                    value={editItem}
                    groups={groups}
                    onChange={setEditItem}
                    onSave={saveItem}
                    onCancel={() => setEditItem(null)}
                    saving={saving}
                  />
                ) : (
                  <button
                    onClick={() => setEditItem({ name: '', description: '', group_id: group.id, sort_order: groupItems.length })}
                    style={{ fontSize: '12px', color: NAVY, background: 'none', border: `1px dashed ${BORDER}`, borderRadius: '7px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
                    <Plus size={11}/> Add item
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function GroupForm({ value, onChange, onSave, onCancel, saving }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#EEF1F6', borderRadius: '8px', padding: '12px' }}>
      <input
        autoFocus
        placeholder="Group name *"
        value={value.name}
        onChange={e => onChange(v => ({ ...v, name: e.target.value }))}
        style={inputStyle}
      />
      <input
        placeholder="Description (optional)"
        value={value.description}
        onChange={e => onChange(v => ({ ...v, description: e.target.value }))}
        style={inputStyle}
      />
      <input
        placeholder="Sort order (e.g. 1)"
        type="number"
        value={value.sort_order}
        onChange={e => onChange(v => ({ ...v, sort_order: e.target.value }))}
        style={{ ...inputStyle, width: '120px' }}
      />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onSave} disabled={saving || !value.name?.trim()} style={btnSave}>{saving ? 'Saving…' : value.id ? 'Save changes' : 'Add group'}</button>
        <button onClick={onCancel} style={btnCancel}>Cancel</button>
      </div>
    </div>
  )
}

function ItemForm({ value, groups, onChange, onSave, onCancel, saving }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#EEF1F6', borderRadius: '8px', padding: '12px' }}>
      <input
        autoFocus
        placeholder="Item name *"
        value={value.name}
        onChange={e => onChange(v => ({ ...v, name: e.target.value }))}
        style={inputStyle}
      />
      <input
        placeholder="Description (optional)"
        value={value.description}
        onChange={e => onChange(v => ({ ...v, description: e.target.value }))}
        style={inputStyle}
      />
      {!value.id && (
        <select
          value={value.group_id}
          onChange={e => onChange(v => ({ ...v, group_id: e.target.value }))}
          style={inputStyle}>
          <option value="">Select group…</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onSave} disabled={saving || !value.name?.trim()} style={btnSave}>{saving ? 'Saving…' : value.id ? 'Save changes' : 'Add item'}</button>
        <button onClick={onCancel} style={btnCancel}>Cancel</button>
      </div>
    </div>
  )
}

// ── Products tab ──────────────────────────────────────────────

function ProductsTab() {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [editing,  setEditing]  = useState(null)  // product object or {new:true}
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState(null)
  const [showAll,  setShowAll]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await fetchProducts({ includeInactive: true })
      setProducts(rows)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const EMPTY = { name: '', manufacturer: '', url_website: '', url_branz_appraisal: '', url_codemark: '', url_install_manual: '', is_active: true }

  async function saveProduct() {
    if (!editing?.name?.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: editing.name,
        manufacturer: editing.manufacturer || null,
        url_website: editing.url_website || null,
        url_branz_appraisal: editing.url_branz_appraisal || null,
        url_codemark: editing.url_codemark || null,
        url_install_manual: editing.url_install_manual || null,
        is_active: editing.is_active !== false,
      }
      if (editing.id) {
        await updateProduct(editing.id, payload)
      } else {
        await createProduct(payload)
      }
      setEditing(null)
      await load()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete product "${name}"? It will be removed from all item assignments.`)) return
    try { await deleteProduct(id); await load() }
    catch (e) { setError(e.message) }
  }

  const visible = showAll ? products : products.filter(p => p.is_active)

  if (loading) return <LoadingMsg />

  return (
    <div>
      {error && <ErrorMsg msg={error} onClose={() => setError(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button onClick={() => setEditing({ ...EMPTY })} style={btnPrimary}>
          <Plus size={13}/> Add product
        </button>
        <button onClick={() => setShowAll(s => !s)} style={btnSecondary}>
          {showAll ? 'Hide inactive' : 'Show inactive'}
        </button>
        <span style={{ fontSize: '12px', color: '#aaa', marginLeft: 'auto' }}>
          {visible.length} product{visible.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* New / edit product form */}
      {editing && (
        <ProductForm
          value={editing}
          onChange={setEditing}
          onSave={saveProduct}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}

      {visible.length === 0 && !editing && (
        <EmptyMsg>No products yet. Add your first product above.</EmptyMsg>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {visible.map(p => (
          p.id === editing?.id ? null :
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', border: `1px solid ${BORDER}`, borderRadius: '9px', background: p.is_active ? '#fff' : '#FAFAF8', opacity: p.is_active ? 1 : 0.6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>
                {p.name}
                {!p.is_active && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#aaa', background: '#F0EFEF', padding: '1px 6px', borderRadius: '10px' }}>Inactive</span>}
              </div>
              {p.manufacturer && <div style={{ fontSize: '12px', color: '#888' }}>{p.manufacturer}</div>}
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                {p.url_website         && <LinkChip href={p.url_website}         label="Website"/>}
                {p.url_branz_appraisal && <LinkChip href={p.url_branz_appraisal} label="BRANZ"/>}
                {p.url_codemark        && <LinkChip href={p.url_codemark}         label="CodeMark"/>}
                {p.url_install_manual  && <LinkChip href={p.url_install_manual}   label="Install Manual"/>}
              </div>
            </div>
            <IconBtn icon={<Edit2 size={13}/>} onClick={() => setEditing({ ...p })} title="Edit" />
            <IconBtn icon={<Trash2 size={13}/>} onClick={() => handleDelete(p.id, p.name)} title="Delete" danger />
          </div>
        ))}

        {/* Inline edit */}
        {editing?.id && (
          <ProductForm
            value={editing}
            onChange={setEditing}
            onSave={saveProduct}
            onCancel={() => setEditing(null)}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}

function ProductForm({ value, onChange, onSave, onCancel, saving }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#EEF1F6', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          autoFocus
          placeholder="Product name *"
          value={value.name}
          onChange={e => onChange(v => ({ ...v, name: e.target.value }))}
          style={{ ...inputStyle, flex: 2 }}
        />
        <input
          placeholder="Manufacturer"
          value={value.manufacturer || ''}
          onChange={e => onChange(v => ({ ...v, manufacturer: e.target.value }))}
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>
      <input placeholder="Website URL" value={value.url_website || ''} onChange={e => onChange(v => ({ ...v, url_website: e.target.value }))} style={inputStyle} />
      <input placeholder="BRANZ Appraisal URL" value={value.url_branz_appraisal || ''} onChange={e => onChange(v => ({ ...v, url_branz_appraisal: e.target.value }))} style={inputStyle} />
      <input placeholder="CodeMark URL" value={value.url_codemark || ''} onChange={e => onChange(v => ({ ...v, url_codemark: e.target.value }))} style={inputStyle} />
      <input placeholder="Install Manual URL" value={value.url_install_manual || ''} onChange={e => onChange(v => ({ ...v, url_install_manual: e.target.value }))} style={inputStyle} />
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#444', cursor: 'pointer' }}>
        <input type="checkbox" checked={value.is_active !== false} onChange={e => onChange(v => ({ ...v, is_active: e.target.checked }))} />
        Active (visible for selection on projects)
      </label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onSave} disabled={saving || !value.name?.trim()} style={btnSave}>{saving ? 'Saving…' : value.id ? 'Save changes' : 'Add product'}</button>
        <button onClick={onCancel} style={btnCancel}>Cancel</button>
      </div>
    </div>
  )
}

// ── Assign Products tab ───────────────────────────────────────

function AssignTab() {
  const [groups,   setGroups]   = useState([])
  const [items,    setItems]    = useState([])
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState({})
  const [saving,   setSaving]   = useState({})
  const [error,    setError]    = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [grps, itms, prods] = await Promise.all([
        fetchGroups(),
        fetchItemsWithProducts(),
        fetchProducts({ includeInactive: false }),
      ])
      setGroups(grps)
      setItems(itms)
      setProducts(prods)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleAssign(itemId, productId, isCurrentlyAssigned, itemProductId) {
    const key = `${itemId}-${productId}`
    setSaving(s => ({ ...s, [key]: true }))
    try {
      if (isCurrentlyAssigned) {
        await removeProductFromItem(itemId, productId)
      } else {
        await assignProductToItem({ item_id: itemId, product_id: productId, is_default: false })
      }
      await load()
    } catch (e) { setError(e.message) }
    finally { setSaving(s => ({ ...s, [key]: false })) }
  }

  async function toggleDefault(itemProductId, isCurrentlyDefault) {
    setSaving(s => ({ ...s, [`def-${itemProductId}`]: true }))
    try {
      await setDefaultProduct(itemProductId, !isCurrentlyDefault)
      await load()
    } catch (e) { setError(e.message) }
    finally { setSaving(s => ({ ...s, [`def-${itemProductId}`]: false })) }
  }

  if (loading) return <LoadingMsg />

  return (
    <div>
      {error && <ErrorMsg msg={error} onClose={() => setError(null)} />}

      <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px', lineHeight: '1.6' }}>
        Tick the products that should be available for each item. Mark one as default to pre-select it on new projects.
      </p>

      {groups.length === 0 && <EmptyMsg>No groups yet — add groups and items first.</EmptyMsg>}

      {groups.map(group => {
        const groupItems = items.filter(i => i.group_id === group.id)
        if (groupItems.length === 0) return null
        const isOpen = !!expanded[group.id]

        return (
          <div key={group.id} style={{ marginBottom: '10px', border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
            <button
              onClick={() => setExpanded(e => ({ ...e, [group.id]: !e[group.id] }))}
              style={{ width: '100%', padding: '12px 14px', background: '#F7F6F3', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'inherit' }}>
              <span style={{ color: '#aaa' }}>{isOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: NAVY, flex: 1, textAlign: 'left' }}>{group.name}</span>
              <span style={{ fontSize: '12px', color: '#aaa' }}>{groupItems.length} items</span>
            </button>

            {isOpen && (
              <div style={{ padding: '10px 14px 14px' }}>
                {groupItems.map(item => {
                  const assignedMap = {}
                  item.assignedProducts.forEach(ip => { assignedMap[ip.product_id] = ip })

                  return (
                    <div key={item.id} style={{ marginBottom: '14px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', paddingLeft: '4px' }}>
                        {item.name}
                        {item.description && <span style={{ fontSize: '11px', color: '#aaa', marginLeft: '8px' }}>{item.description}</span>}
                      </div>

                      {products.length === 0 && (
                        <div style={{ fontSize: '12px', color: '#ccc', paddingLeft: '4px' }}>No products in library yet.</div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {products.map(p => {
                          const ip = assignedMap[p.id]
                          const isAssigned = !!ip
                          const isDefault  = !!ip?.is_default
                          const key = `${item.id}-${p.id}`
                          const isSaving = saving[key]

                          return (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', border: `1px solid ${isAssigned ? BORDER : '#F3F1EB'}`, borderRadius: '7px', background: isAssigned ? '#fff' : '#FAFAF8' }}>
                              {/* Assign toggle */}
                              <button
                                disabled={isSaving}
                                onClick={() => toggleAssign(item.id, p.id, isAssigned, ip?.id)}
                                style={{
                                  width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0,
                                  border: `2px solid ${isAssigned ? NAVY : '#D0CEC6'}`,
                                  background: isAssigned ? NAVY : '#fff',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'pointer', padding: 0,
                                }}>
                                {isAssigned && <Check size={11} color="#fff" />}
                              </button>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: '12px', color: isAssigned ? '#1a1a1a' : '#aaa' }}>{p.name}</span>
                                {p.manufacturer && <span style={{ fontSize: '11px', color: '#bbb', marginLeft: '6px' }}>{p.manufacturer}</span>}
                              </div>

                              {/* Default toggle — only shown when assigned */}
                              {isAssigned && (
                                <button
                                  disabled={saving[`def-${ip.id}`]}
                                  onClick={() => toggleDefault(ip.id, isDefault)}
                                  style={{
                                    fontSize: '10px', padding: '2px 8px', borderRadius: '10px', cursor: 'pointer',
                                    fontFamily: 'inherit', border: 'none',
                                    background: isDefault ? '#F0E8D0' : '#F0EFEF',
                                    color: isDefault ? '#7A5C10' : '#aaa',
                                    fontWeight: isDefault ? '600' : '400',
                                  }}>
                                  {isDefault ? '★ Default' : 'Set default'}
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Shared small components ───────────────────────────────────

function LinkChip({ href, label }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
       style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '4px', background: '#EEF1F6', color: NAVY, textDecoration: 'none', fontWeight: '500' }}>
      {label}
    </a>
  )
}

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

const btnSecondary = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '7px 14px', background: 'transparent', color: '#666',
  border: `1px solid #D0CEC6`, borderRadius: '8px', fontSize: '12px',
  cursor: 'pointer', fontFamily: 'inherit',
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
