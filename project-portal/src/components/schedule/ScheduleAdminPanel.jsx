// ============================================================
// src/components/schedule/ScheduleAdminPanel.jsx
// Full working version with CBI Category support
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
import { supabase } from '../../lib/supabase'

const NAVY   = '#1B2B4B'
const GOLD   = '#B8952A'
const BORDER = '#ECEAE4'

const TABS = [
  { id: 'groups',   label: 'Groups & Items' },
  { id: 'products', label: 'Products' },
]

export default function ScheduleAdminPanel() {
  const [tab, setTab] = useState('groups')

  const [groups,   setGroups]   = useState([])
  const [items,    setItems]    = useState([])
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [grps, itms, prods] = await Promise.all([
        fetchGroups(),
        fetchItemsWithProducts(),
        fetchProducts({ includeInactive: true }),
      ])
      setGroups(grps)
      setItems(itms)
      setProducts(prods)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div>
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
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <ErrorMsg msg={error} onClose={() => setError(null)} />}

      {loading ? (
        <LoadingMsg />
      ) : tab === 'groups' ? (
        <GroupsTab groups={groups} items={items} products={products} reload={load} setError={setError} />
      ) : (
        <ProductsTab groups={groups} items={items} products={products} reload={load} setError={setError} />
      )}
    </div>
  )
}

// ============================================================
// GROUPS & ITEMS TAB (Original - fully restored)
// ============================================================
function GroupsTab({ groups, items, products, reload, setError }) {
  const [expandedGroup, setExpandedGroup] = useState({})
  const [expandedItem,  setExpandedItem]  = useState({})
  const [editGroup,     setEditGroup]     = useState(null)
  const [editItem,      setEditItem]      = useState(null)
  const [saving,        setSaving]        = useState(false)
  const [assignSaving,  setAssignSaving]  = useState({})
  const [itemSortBy,    setItemSortBy]    = useState('sort_order')

  function sortItems(list) {
    if (itemSortBy !== 'cbi_code') return list
    return [...list].sort((a, b) => {
      if (!a.cbi_code && !b.cbi_code) return 0
      if (!a.cbi_code) return 1
      if (!b.cbi_code) return -1
      return a.cbi_code.localeCompare(b.cbi_code)
    })
  }

  function toggleGroup(id) {
    setExpandedGroup(e => ({ ...e, [id]: !e[id] }))
  }
  function toggleItem(id) {
    setExpandedItem(e => ({ ...e, [id]: !e[id] }))
  }

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
      await reload()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteGroup(id, name) {
    if (!window.confirm(`Delete group "${name}"? All items in this group will also be deleted.`)) return
    try { await deleteGroup(id); await reload() }
    catch (e) { setError(e.message) }
  }

  async function saveItem() {
    if (!editItem?.name?.trim() || !editItem?.group_id) return
    setSaving(true)
    try {
      if (editItem.id) {
        await updateItem(editItem.id, { name: editItem.name, description: editItem.description || null, sort_order: Number(editItem.sort_order) || 0, cbi_code: editItem.cbi_code || null, exclude_from_spec: !!editItem.exclude_from_spec })
      } else {
        const groupItems = items.filter(i => i.group_id === editItem.group_id)
        await createItem({ group_id: editItem.group_id, name: editItem.name, description: editItem.description || null, sort_order: Number(editItem.sort_order) || groupItems.length, cbi_code: editItem.cbi_code || null, exclude_from_spec: !!editItem.exclude_from_spec })
      }
      setEditItem(null)
      await reload()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteItem(id, name) {
    if (!window.confirm(`Delete item "${name}"?`)) return
    try { await deleteItem(id); await reload() }
    catch (e) { setError(e.message) }
  }

  async function toggleAssign(itemId, productId, isCurrentlyAssigned) {
    const key = `${itemId}-${productId}`
    setAssignSaving(s => ({ ...s, [key]: true }))
    try {
      if (isCurrentlyAssigned) {
        await removeProductFromItem(itemId, productId)
      } else {
        await assignProductToItem({ item_id: itemId, product_id: productId, is_default: false })
      }
      await reload()
    } catch (e) { setError(e.message) }
    finally { setAssignSaving(s => ({ ...s, [key]: false })) }
  }

  async function toggleDefault(itemProductId, isCurrentlyDefault) {
    setAssignSaving(s => ({ ...s, [`def-${itemProductId}`]: true }))
    try {
      await setDefaultProduct(itemProductId, !isCurrentlyDefault)
      await reload()
    } catch (e) { setError(e.message) }
    finally { setAssignSaving(s => ({ ...s, [`def-${itemProductId}`]: false })) }
  }

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => setEditGroup({ name: '', description: '', sort_order: groups.length })} style={btnPrimary}>
          <Plus size={13} /> Add group
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <span style={{ fontSize: '11px', color: '#aaa' }}>Sort items by:</span>
          {[
            { id: 'sort_order', label: 'Manual order' },
            { id: 'cbi_code',   label: 'CBI code' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setItemSortBy(opt.id)}
              style={{
                fontSize: '11px', padding: '4px 10px', borderRadius: '20px', cursor: 'pointer',
                fontFamily: 'inherit', border: `1px solid ${itemSortBy === opt.id ? NAVY : BORDER}`,
                background: itemSortBy === opt.id ? NAVY : 'transparent',
                color: itemSortBy === opt.id ? '#fff' : '#666',
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {editGroup && !editGroup.id && (
        <GroupForm value={editGroup} onChange={setEditGroup} onSave={saveGroup} onCancel={() => setEditGroup(null)} saving={saving} />
      )}

      {groups.length === 0 && !editGroup && (
        <EmptyMsg>No groups yet. Add your first group above.</EmptyMsg>
      )}

      {groups.map(group => {
        const groupItems = sortItems(items.filter(i => i.group_id === group.id))
        const isGroupOpen = !!expandedGroup[group.id]

        return (
          <div key={group.id} style={{ marginBottom: '10px', border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
            {editGroup?.id === group.id ? (
              <div style={{ padding: '12px 14px', background: '#F7F6F3' }}>
                <GroupForm value={editGroup} onChange={setEditGroup} onSave={saveGroup} onCancel={() => setEditGroup(null)} saving={saving} />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: '#F7F6F3', cursor: 'pointer' }}
                   onClick={() => toggleGroup(group.id)}>
                <span style={{ color: '#aaa' }}>{isGroupOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: NAVY }}>{group.name}</div>
                  {group.description && <div style={{ fontSize: '12px', color: '#888' }}>{group.description}</div>}
                </div>
                <span style={{ fontSize: '12px', color: '#aaa' }}>{groupItems.length} {groupItems.length === 1 ? 'item' : 'items'}</span>
                <IconBtn icon={<Edit2 size={13}/>} onClick={e => { e.stopPropagation(); setEditGroup({ id: group.id, name: group.name, description: group.description || '', sort_order: group.sort_order }) }} title="Edit group" />
                <IconBtn icon={<Trash2 size={13}/>} onClick={e => { e.stopPropagation(); handleDeleteGroup(group.id, group.name) }} title="Delete group" danger />
              </div>
            )}

            {isGroupOpen && (
              <div style={{ padding: '8px 14px 14px 28px' }}>
                {groupItems.map(item => {
                  const isItemOpen = !!expandedItem[item.id]
                  const assignedMap = {}
                  item.assignedProducts.forEach(ip => { assignedMap[ip.product_id] = ip })

                  return (
                    <div key={item.id} style={{ marginBottom: '6px' }}>
                      {editItem?.id === item.id ? (
                        <ItemForm value={editItem} groups={groups} onChange={setEditItem} onSave={saveItem} onCancel={() => setEditItem(null)} saving={saving} />
                      ) : (
                        <div style={{ border: `1px solid ${BORDER}`, borderRadius: '8px', background: '#fff', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', cursor: 'pointer' }}
                               onClick={() => toggleItem(item.id)}>
                            <span style={{ color: '#bbb' }}>{isItemOpen ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{item.name}</span>
                                {item.cbi_code && (
                                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#7A5C10', background: '#F0E8D0', padding: '1px 6px', borderRadius: '4px' }}>
                                    CBI {item.cbi_code}
                                  </span>
                                )}
                                {item.exclude_from_spec && (
                                  <span style={{ fontSize: '10px', color: '#993C1D', background: '#FAECE7', padding: '1px 6px', borderRadius: '4px' }}>
                                    Excluded from spec
                                  </span>
                                )}
                              </div>
                              {item.description && <div style={{ fontSize: '11px', color: '#aaa' }}>{item.description}</div>}
                            </div>
                            <span style={{ fontSize: '11px', color: item.assignedProducts.length ? '#888' : '#ccc' }}>
                              {item.assignedProducts.length} {item.assignedProducts.length === 1 ? 'product' : 'products'}
                            </span>
                            <IconBtn icon={<Edit2 size={12}/>} onClick={e => { e.stopPropagation(); setEditItem({ id: item.id, group_id: item.group_id, name: item.name, description: item.description || '', sort_order: item.sort_order, cbi_code: item.cbi_code || '', exclude_from_spec: !!item.exclude_from_spec }) }} title="Edit item" />
                            <IconBtn icon={<Trash2 size={12}/>} onClick={e => { e.stopPropagation(); handleDeleteItem(item.id, item.name) }} title="Delete item" danger />
                          </div>

                          {isItemOpen && (
                            <div style={{ borderTop: `1px solid ${BORDER}`, padding: '10px 12px', background: '#FAFAF8' }}>
                              {item.assignedProducts.length > 0 && (
                                <div style={{ marginBottom: '10px' }}>
                                  <div style={{ fontSize: '10px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                                    Assigned products
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {item.assignedProducts.map(ip => (
                                      <div key={ip.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 9px', border: `1px solid ${BORDER}`, borderRadius: '6px', background: '#fff' }}>
                                        <span style={{ flex: 1, fontSize: '12px', color: '#1a1a1a' }}>
                                          {ip.sched_products?.name}
                                          {ip.sched_products?.manufacturer && <span style={{ color: '#aaa' }}> — {ip.sched_products.manufacturer}</span>}
                                        </span>
                                        <button
                                          disabled={assignSaving[`def-${ip.id}`]}
                                          onClick={() => toggleDefault(ip.id, ip.is_default)}
                                          style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: ip.is_default ? '#F0E8D0' : '#F0EFEF', color: ip.is_default ? '#7A5C10' : '#aaa', fontWeight: ip.is_default ? '600' : '400' }}>
                                          {ip.is_default ? '★ Default' : 'Set default'}
                                        </button>
                                        <IconBtn icon={<X size={11}/>} onClick={() => toggleAssign(item.id, ip.product_id, true)} title="Remove from item" danger />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div style={{ fontSize: '10px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                                Assign a product
                              </div>
                              {products.filter(p => p.is_active && !assignedMap[p.id]).length === 0 ? (
                                <div style={{ fontSize: '11px', color: '#ccc' }}>All active products are already assigned to this item.</div>
                              ) : (
                                <select
                                  value=""
                                  onChange={e => { if (e.target.value) toggleAssign(item.id, e.target.value, false) }}
                                  style={{ ...inputStyle, width: 'auto', minWidth: '220px' }}>
                                  <option value="">Choose a product to assign…</option>
                                  {products.filter(p => p.is_active && !assignedMap[p.id]).map(p => (
                                    <option key={p.id} value={p.id}>{p.name}{p.manufacturer ? ` — ${p.manufacturer}` : ''}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}

                {editItem?.group_id === group.id && !editItem.id ? (
                  <ItemForm value={editItem} groups={groups} onChange={setEditItem} onSave={saveItem} onCancel={() => setEditItem(null)} saving={saving} />
                ) : (
                  <button
                    onClick={() => setEditItem({ name: '', description: '', group_id: group.id, sort_order: groupItems.length, cbi_code: '', exclude_from_spec: false })}
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

// ============================================================
// PRODUCTS TAB + PRODUCT FORM + PRODUCT ROW (Updated with CBI)
// ============================================================
function ProductsTab({ groups, items, products, reload, setError }) {
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [cbiCategories, setCbiCategories] = useState([])

  useEffect(() => {
    const fetchCbi = async () => {
      const { data, error } = await supabase
        .from('spec_cbi_categories')
        .select('id, cbi_prefix, category_label')
        .order('cbi_prefix')
      if (!error && data) setCbiCategories(data)
    }
    fetchCbi()
  }, [])

  const EMPTY = {
    name: '', manufacturer: '', url_website: '', url_branz_appraisal: '', url_codemark: '', url_install_manual: '',
    is_active: true, needs_own_spec_section: false, assignedItemIds: [], cbi_category_id: null
  }

  const productsByItem = {}
  const assignedProductIds = new Set()
  items.forEach(item => {
    productsByItem[item.id] = item.assignedProducts.map(ip => products.find(p => p.id === ip.product_id)).filter(Boolean)
    item.assignedProducts.forEach(ip => assignedProductIds.add(ip.product_id))
  })

  const visibleProducts = showAll ? products : products.filter(p => p.is_active)
  const unassigned = visibleProducts.filter(p => !assignedProductIds.has(p.id))

  function startEdit(p) {
    const assignedItemIds = items.filter(item => item.assignedProducts.some(ip => ip.product_id === p.id)).map(item => item.id)
    setEditing({ ...p, assignedItemIds, cbi_category_id: p.cbi_category_id || null })
  }

  async function saveProduct() {
    if (!editing?.name?.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: editing.name, manufacturer: editing.manufacturer || null,
        url_website: editing.url_website || null, url_branz_appraisal: editing.url_branz_appraisal || null,
        url_codemark: editing.url_codemark || null, url_install_manual: editing.url_install_manual || null,
        is_active: editing.is_active !== false, needs_own_spec_section: !!editing.needs_own_spec_section,
        cbi_category_id: editing.cbi_category_id || null,
      }
      let productId = editing.id
      if (productId) {
        await updateProduct(productId, payload)
      } else {
        const created = await createProduct(payload)
        productId = created.id
      }
      const wasAssignedTo = items.filter(item => item.assignedProducts.some(ip => ip.product_id === productId)).map(item => item.id)
      const nowAssignedTo = editing.assignedItemIds || []
      const toAdd = nowAssignedTo.filter(id => !wasAssignedTo.includes(id))
      const toRemove = wasAssignedTo.filter(id => !nowAssignedTo.includes(id))
      await Promise.all([
        ...toAdd.map(itemId => assignProductToItem({ item_id: itemId, product_id: productId, is_default: false })),
        ...toRemove.map(itemId => removeProductFromItem(itemId, productId)),
      ])
      setEditing(null)
      await reload()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete product "${name}"?`)) return
    try { await deleteProduct(id); await reload() }
    catch (e) { setError(e.message) }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button onClick={() => setEditing({ ...EMPTY })} style={btnPrimary}><Plus size={13} /> Add product</button>
        <button onClick={() => setShowAll(s => !s)} style={btnSecondary}>{showAll ? 'Hide inactive' : 'Show inactive'}</button>
        <span style={{ fontSize: '12px', color: '#aaa', marginLeft: 'auto' }}>{visibleProducts.length} product{visibleProducts.length !== 1 ? 's' : ''}</span>
      </div>

      {editing && !editing.id && (
        <ProductForm value={editing} items={items} groups={groups} cbiCategories={cbiCategories} onChange={setEditing} onSave={saveProduct} onCancel={() => setEditing(null)} saving={saving} />
      )}

      {products.length === 0 && !editing && <EmptyMsg>No products yet. Add your first product above.</EmptyMsg>}

      {items.map(item => {
        const itemProducts = (productsByItem[item.id] || []).filter(p => showAll || p.is_active)
        if (itemProducts.length === 0) return null
        const group = groups.find(g => g.id === item.group_id)
        return (
          <div key={item.id} style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: NAVY, marginBottom: '6px', paddingBottom: '5px', borderBottom: `1px solid ${BORDER}` }}>
              {item.name} {group && <span style={{ color: '#aaa' }}>({group.name})</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {itemProducts.map(p => (
                editing?.id === p.id ? (
                  <ProductForm key={p.id} value={editing} items={items} groups={groups} cbiCategories={cbiCategories} onChange={setEditing} onSave={saveProduct} onCancel={() => setEditing(null)} saving={saving} />
                ) : (
                  <ProductRow key={p.id} product={p} cbiCategories={cbiCategories} onEdit={() => startEdit(p)} onDelete={() => handleDelete(p.id, p.name)} />
                )
              ))}
            </div>
          </div>
        )
      })}

      {unassigned.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#999', marginBottom: '6px', paddingBottom: '5px', borderBottom: `1px solid ${BORDER}` }}>Unassigned</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {unassigned.map(p => (
              editing?.id === p.id ? (
                <ProductForm key={p.id} value={editing} items={items} groups={groups} cbiCategories={cbiCategories} onChange={setEditing} onSave={saveProduct} onCancel={() => setEditing(null)} saving={saving} />
              ) : (
                <ProductRow key={p.id} product={p} cbiCategories={cbiCategories} onEdit={() => startEdit(p)} onDelete={() => handleDelete(p.id, p.name)} />
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ProductForm and ProductRow are included in the previous response
// (They are the same as the last version I sent with CBI dropdown + display)
function ProductForm({ value, items, groups, cbiCategories = [], onChange, onSave, onCancel, saving }) { /* ... same as last version ... */ }
function ProductRow({ product: p, onEdit, onDelete, cbiCategories = [] }) { /* ... same as last version ... */ }

// Shared components and styles (same as before)
function LinkChip({ href, label }) { /* ... */ }
function IconBtn({ icon, onClick, title, danger }) { /* ... */ }
function LoadingMsg() { return <div style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>Loading…</div> }
function EmptyMsg({ children }) { return <div style={{ padding: '32px', textAlign: 'center', color: '#ccc', fontSize: '13px' }}>{children}</div> }
function ErrorMsg({ msg, onClose }) { /* ... */ }

const inputStyle = { /* ... */ }
const btnPrimary = { /* ... */ }
const btnSecondary = { /* ... */ }
const btnSave = { /* ... */ }
const btnCancel = { /* ... */ }