// ============================================================
// src/components/schedule/ScheduleAdminPanel.jsx
// Full version with EmptyState component + ConfirmModal + FormField + Button
// ============================================================

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronRight, FolderOpen, Package } from 'lucide-react'
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
import { useToast } from '../Toast/ToastContext'
import FormField from '../common/FormField'
import Button from '../common/Button'
import ConfirmModal from '../common/ConfirmModal'
import EmptyState from '../common/EmptyState'

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

  const { showToast } = useToast()

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

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
    } catch (e) { 
      setError(e.message)
      showToast(e.message, 'error')
    }
    finally { setLoading(false) }
  }, [showToast])

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
        <GroupsTab 
          groups={groups} 
          items={items} 
          products={products} 
          reload={load} 
          setError={setError} 
          showToast={showToast}
          setConfirmModal={setConfirmModal}
        />
      ) : (
        <ProductsTab 
          groups={groups} 
          items={items} 
          products={products} 
          reload={load} 
          setError={setError} 
          showToast={showToast}
          setConfirmModal={setConfirmModal}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  )
}

// ============================================================
// GROUPS & ITEMS TAB
// ============================================================
function GroupsTab({ groups, items, products, reload, setError, showToast, setConfirmModal }) {
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
      showToast('Group saved successfully', 'success')
    } catch (e) { 
      setError(e.message)
      showToast(e.message, 'error')
    }
    finally { setSaving(false) }
  }

  async function handleDeleteGroup(id, name) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Group?',
      message: `Are you sure you want to delete "${name}"? All items in this group will also be deleted.`,
      onConfirm: async () => {
        try {
          await deleteGroup(id)
          await reload()
          showToast('Group deleted', 'success')
        } catch (e) {
          setError(e.message)
          showToast(e.message, 'error')
        }
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })
      }
    })
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
      showToast('Item saved successfully', 'success')
    } catch (e) { 
      setError(e.message)
      showToast(e.message, 'error')
    }
    finally { setSaving(false) }
  }

  async function handleDeleteItem(id, name) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Item?',
      message: `Are you sure you want to delete "${name}"?`,
      onConfirm: async () => {
        try {
          await deleteItem(id)
          await reload()
          showToast('Item deleted', 'success')
        } catch (e) {
          setError(e.message)
          showToast(e.message, 'error')
        }
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })
      }
    })
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
    } catch (e) { 
      setError(e.message)
      showToast(e.message, 'error')
    }
    finally { setAssignSaving(s => ({ ...s, [key]: false })) }
  }

  async function toggleDefault(itemProductId, isCurrentlyDefault) {
    setAssignSaving(s => ({ ...s, [`def-${itemProductId}`]: true }))
    try {
      await setDefaultProduct(itemProductId, !isCurrentlyDefault)
      await reload()
    } catch (e) { 
      setError(e.message)
      showToast(e.message, 'error')
    }
    finally { setAssignSaving(s => ({ ...s, [`def-${itemProductId}`]: false })) }
  }

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Button onClick={() => setEditGroup({ name: '', description: '', sort_order: groups.length })}>
          <Plus size={14} /> Add group
        </Button>
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
        <EmptyState
          icon={<FolderOpen size={48} />}
          title="No groups yet"
          description="Create your first group to start building your Schedule of Finishes library."
          actionLabel="Add Group"
          onAction={() => setEditGroup({ name: '', description: '', sort_order: 0 })}
        />
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
                {groupItems.length === 0 && (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
                    No items in this group yet.
                  </div>
                )}

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
                  <Button variant="ghost" onClick={() => setEditItem({ name: '', description: '', group_id: group.id, sort_order: groupItems.length, cbi_code: '', exclude_from_spec: false })}>
                    <Plus size={13} /> Add item
                  </Button>
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
// PRODUCTS TAB
// ============================================================
function ProductsTab({ groups, items, products, reload, setError, showToast, setConfirmModal }) {
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
        name: editing.name,
        manufacturer: editing.manufacturer || null,
        url_website: editing.url_website || null,
        url_branz_appraisal: editing.url_branz_appraisal || null,
        url_codemark: editing.url_codemark || null,
        url_install_manual: editing.url_install_manual || null,
        is_active: editing.is_active !== false,
        needs_own_spec_section: !!editing.needs_own_spec_section,
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
      showToast('Product saved successfully', 'success')
    } catch (e) {
      setError(e.message)
      showToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, name) {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Product?',
      message: `Are you sure you want to delete "${name}"? It will be removed from all item assignments.`,
      onConfirm: async () => {
        try {
          await deleteProduct(id)
          await reload()
          showToast('Product deleted', 'success')
        } catch (e) {
          setError(e.message)
          showToast(e.message, 'error')
        }
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })
      }
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Button onClick={() => setEditing({ ...EMPTY })}>
          <Plus size={14} /> Add product
        </Button>
        <Button variant="secondary" onClick={() => setShowAll(s => !s)}>
          {showAll ? 'Hide inactive' : 'Show inactive'}
        </Button>
        <span style={{ fontSize: '12px', color: '#aaa', marginLeft: 'auto' }}>
          {visibleProducts.length} product{visibleProducts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {editing && !editing.id && (
        <ProductForm value={editing} items={items} groups={groups} cbiCategories={cbiCategories} onChange={setEditing} onSave={saveProduct} onCancel={() => setEditing(null)} saving={saving} />
      )}

      {products.length === 0 && !editing && (
        <EmptyState
          icon={<Package size={48} />}
          title="No products yet"
          description="Add your first product to start building your library."
          actionLabel="Add Product"
          onAction={() => setEditing({ name: '', manufacturer: '', is_active: true, needs_own_spec_section: false, assignedItemIds: [] })}
        />
      )}

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

// ProductForm
function ProductForm({ value, items, groups, cbiCategories = [], onChange, onSave, onCancel, saving }) {
  function toggleItemAssignment(itemId) {
    onChange(v => {
      const current = v.assignedItemIds || []
      const next = current.includes(itemId) ? current.filter(id => id !== itemId) : [...current, itemId]
      return { ...v, assignedItemIds: next }
    })
  }

  return (
    <div style={{ background: '#EEF1F6', borderRadius: '10px', padding: '18px', marginBottom: '16px' }}>
      <FormField label="Product Name" required>
        <input autoFocus placeholder="Product name" value={value.name} onChange={e => onChange(v => ({ ...v, name: e.target.value }))} style={inputStyle} />
      </FormField>

      <FormField label="Manufacturer">
        <input placeholder="Manufacturer" value={value.manufacturer || ''} onChange={e => onChange(v => ({ ...v, manufacturer: e.target.value }))} style={inputStyle} />
      </FormField>

      <FormField label="CBI Category" required helper="Link this product to a CBI classification">
        <select value={value.cbi_category_id || ''} onChange={e => onChange(v => ({ ...v, cbi_category_id: e.target.value || null }))} style={inputStyle}>
          <option value="">— Unassigned —</option>
          {cbiCategories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.cbi_prefix} – {cat.category_label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Website URL">
        <input placeholder="Website URL" value={value.url_website || ''} onChange={e => onChange(v => ({ ...v, url_website: e.target.value }))} style={inputStyle} />
      </FormField>

      <FormField label="BRANZ Appraisal URL">
        <input placeholder="BRANZ Appraisal URL" value={value.url_branz_appraisal || ''} onChange={e => onChange(v => ({ ...v, url_branz_appraisal: e.target.value }))} style={inputStyle} />
      </FormField>

      <FormField label="CodeMark URL">
        <input placeholder="CodeMark URL" value={value.url_codemark || ''} onChange={e => onChange(v => ({ ...v, url_codemark: e.target.value }))} style={inputStyle} />
      </FormField>

      <FormField label="Install Manual URL">
        <input placeholder="Install Manual URL" value={value.url_install_manual || ''} onChange={e => onChange(v => ({ ...v, url_install_manual: e.target.value }))} style={inputStyle} />
      </FormField>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#444', cursor: 'pointer' }}>
          <input type="checkbox" checked={value.is_active !== false} onChange={e => onChange(v => ({ ...v, is_active: e.target.checked }))} />
          Active
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#444', cursor: 'pointer' }}>
          <input type="checkbox" checked={!!value.needs_own_spec_section} onChange={e => onChange(v => ({ ...v, needs_own_spec_section: e.target.checked }))} />
          Needs its own dedicated specification section
        </label>
      </div>

      <FormField label="Assign to Items">
        {items.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#aaa' }}>No items in the library yet.</div>
        ) : (
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: `1px solid #D0CEC6`, borderRadius: '8px', background: '#fff', padding: '8px' }}>
            {groups.map(group => {
              const groupItems = items.filter(i => i.group_id === group.id)
              if (groupItems.length === 0) return null
              return (
                <div key={group.id} style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#888', marginBottom: '4px' }}>{group.name}</div>
                  {groupItems.map(item => {
                    const isChecked = (value.assignedItemIds || []).includes(item.id)
                    return (
                      <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', cursor: 'pointer', fontSize: '13px' }}>
                        <input type="checkbox" checked={isChecked} onChange={() => toggleItemAssignment(item.id)} />
                        {item.name}
                      </label>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </FormField>

      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <Button onClick={onSave} disabled={saving || !value.name?.trim()}>
          {saving ? 'Saving…' : value.id ? 'Save changes' : 'Add product'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

// ProductRow
function ProductRow({ product: p, onEdit, onDelete, cbiCategories = [] }) {
  const linkedCbi = cbiCategories.find(cat => cat.id === p.cbi_category_id)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', border: `1px solid ${BORDER}`, borderRadius: '9px', background: p.is_active ? '#fff' : '#FAFAF8', opacity: p.is_active ? 1 : 0.6 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>
          {p.name}
          {!p.is_active && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#aaa', background: '#F0EFEF', padding: '1px 6px', borderRadius: '10px' }}>Inactive</span>}
          {p.needs_own_spec_section && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#534AB7', background: '#EEEDFE', padding: '1px 6px', borderRadius: '10px' }}>Own spec section</span>}
        </div>
        {p.manufacturer && <div style={{ fontSize: '12px', color: '#888' }}>{p.manufacturer}</div>}
        {linkedCbi && (
          <div style={{ marginTop: '4px' }}>
            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#7A5C10', background: '#F0E8D0', padding: '1px 6px', borderRadius: '4px' }}>
              {linkedCbi.cbi_prefix} – {linkedCbi.category_label}
            </span>
          </div>
        )}
      </div>
      <IconBtn icon={<Edit2 size={13}/>} onClick={onEdit} title="Edit" />
      <IconBtn icon={<Trash2 size={13}/>} onClick={onDelete} title="Delete" danger />
    </div>
  )
}

// Shared components
function GroupForm({ value, onChange, onSave, onCancel, saving }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#EEF1F6', borderRadius: '8px', padding: '12px' }}>
      <input autoFocus placeholder="Group name *" value={value.name} onChange={e => onChange(v => ({ ...v, name: e.target.value }))} style={inputStyle} />
      <input placeholder="Description (optional)" value={value.description} onChange={e => onChange(v => ({ ...v, description: e.target.value }))} style={inputStyle} />
      <input placeholder="Sort order" type="number" value={value.sort_order} onChange={e => onChange(v => ({ ...v, sort_order: e.target.value }))} style={{ ...inputStyle, width: '120px' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button onClick={onSave} disabled={saving || !value.name?.trim()}>{saving ? 'Saving…' : value.id ? 'Save changes' : 'Add group'}</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

function ItemForm({ value, groups, onChange, onSave, onCancel, saving }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#EEF1F6', borderRadius: '8px', padding: '12px' }}>
      <input autoFocus placeholder="Item name *" value={value.name} onChange={e => onChange(v => ({ ...v, name: e.target.value }))} style={inputStyle} />
      <input placeholder="Description (optional)" value={value.description} onChange={e => onChange(v => ({ ...v, description: e.target.value }))} style={inputStyle} />
      <input placeholder="CBI code (optional)" value={value.cbi_code || ''} onChange={e => onChange(v => ({ ...v, cbi_code: e.target.value }))} style={{ ...inputStyle, width: '220px' }} />
      {!value.id && (
        <select value={value.group_id} onChange={e => onChange(v => ({ ...v, group_id: e.target.value }))} style={inputStyle}>
          <option value="">Select group…</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      )}
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#444', cursor: 'pointer' }}>
        <input type="checkbox" checked={!!value.exclude_from_spec} onChange={e => onChange(v => ({ ...v, exclude_from_spec: e.target.checked }))} />
        Exclude from generated specification
      </label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button onClick={onSave} disabled={saving || !value.name?.trim()}>{saving ? 'Saving…' : value.id ? 'Save changes' : 'Add item'}</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

function LinkChip({ href, label }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
            style={{ fontSize: '10px', padding: '1px 7px', borderRadius: '4px', background: '#EEF1F6', color: NAVY, textDecoration: 'none', fontWeight: '500' }}>{label}</a>
}

function IconBtn({ icon, onClick, title, danger }) {
  return <button onClick={onClick} title={title}
                 style={{ background: 'none', border: `1px solid ${danger ? '#fecaca' : BORDER}`, borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', color: danger ? '#dc2626' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</button>
}

function LoadingMsg() { return <div style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>Loading…</div> }
function ErrorMsg({ msg, onClose }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#FAECE7', color: '#993C1D', borderRadius: '8px', marginBottom: '14px', fontSize: '13px' }}>
    <span style={{ flex: 1 }}>{msg}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#993C1D' }}><X size={13}/></button>
  </div>
}

const inputStyle = { padding: '9px 12px', border: `1px solid ${BORDER}`, borderRadius: '7px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#1a1a1a', width: '100%', boxSizing: 'border-box' }