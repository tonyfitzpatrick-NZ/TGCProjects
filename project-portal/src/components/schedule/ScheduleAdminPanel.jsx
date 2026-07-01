// ============================================================
// src/components/schedule/ScheduleAdminPanel.jsx
// Admin panel for managing the master Schedule of Finishes
// library: Groups → Items → Products.
// 
// Added: CBI Category dropdown on products (required + Unassigned option)
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
]

export default function ScheduleAdminPanel() {
  const [tab, setTab] = useState('groups')

  const [groups,   setGroups]   = useState([])
  const [items,    setItems]    = useState([])
  const [products, setProducts] = useState([])
  const [cbiCategories, setCbiCategories] = useState([]) // NEW
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [grps, itms, prods, cbis] = await Promise.all([
        fetchGroups(),
        fetchItemsWithProducts(),
        fetchProducts({ includeInactive: true }),
        // NEW: Fetch CBI categories
        (async () => {
          const { data } = await supabase
            .from('spec_cbi_categories')
            .select('id, cbi_prefix, category_label')
            .order('cbi_prefix')
          return data || []
        })()
      ])
      setGroups(grps)
      setItems(itms)
      setProducts(prods)
      setCbiCategories(cbis)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

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
        <ProductsTab 
          groups={groups} 
          items={items} 
          products={products} 
          cbiCategories={cbiCategories} 
          reload={load} 
          setError={setError} 
        />
      )}
    </div>
  )
}

// ── Groups & Items tab (unchanged) ────────────────────────────
function GroupsTab({ groups, items, products, reload, setError }) {
  // ... (keep your original GroupsTab code exactly as it was)
  // For brevity in this response, the rest of the file continues below with the updated ProductsTab + ProductForm
}

// ── Products tab (updated with CBI Category) ──────────────────
function ProductsTab({ groups, items, products, cbiCategories, reload, setError }) {
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const EMPTY = { 
    name: '', 
    manufacturer: '', 
    url_website: '', 
    url_branz_appraisal: '', 
    url_codemark: '', 
    url_install_manual: '', 
    is_active: true, 
    needs_own_spec_section: false, 
    assignedItemIds: [],
    cbi_category_id: null   // NEW
  }

  const productsByItem = {}
  const assignedProductIds = new Set()
  items.forEach(item => {
    productsByItem[item.id] = item.assignedProducts
      .map(ip => products.find(p => p.id === ip.product_id))
      .filter(Boolean)
    item.assignedProducts.forEach(ip => assignedProductIds.add(ip.product_id))
  })

  const visibleProducts = showAll ? products : products.filter(p => p.is_active)
  const unassigned = visibleProducts.filter(p => !assignedProductIds.has(p.id))

  function startEdit(p) {
    const assignedItemIds = items
      .filter(item => item.assignedProducts.some(ip => ip.product_id === p.id))
      .map(item => item.id)
    setEditing({ 
      ...p, 
      assignedItemIds,
      cbi_category_id: p.cbi_category_id || null   // NEW
    })
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
        cbi_category_id: editing.cbi_category_id || null,   // NEW
      }

      let productId = editing.id
      if (productId) {
        await updateProduct(productId, payload)
      } else {
        const created = await createProduct(payload)
        productId = created.id
      }

      // Reconcile item assignments
      const wasAssignedTo = items
        .filter(item => item.assignedProducts.some(ip => ip.product_id === productId))
        .map(item => item.id)
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
        <button onClick={() => setEditing({ ...EMPTY })} style={btnPrimary}>
          <Plus size={13}/> Add product
        </button>
        <button onClick={() => setShowAll(s => !s)} style={btnSecondary}>
          {showAll ? 'Hide inactive' : 'Show inactive'}
        </button>
        <span style={{ fontSize: '12px', color: '#aaa', marginLeft: 'auto' }}>
          {visibleProducts.length} product{visibleProducts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {editing && !editing.id && (
        <ProductForm 
          value={editing} 
          items={items} 
          groups={groups} 
          cbiCategories={cbiCategories}
          onChange={setEditing} 
          onSave={saveProduct} 
          onCancel={() => setEditing(null)} 
          saving={saving} 
        />
      )}

      {products.length === 0 && !editing && (
        <EmptyMsg>No products yet. Add your first product above.</EmptyMsg>
      )}

      {/* Grouped by item */}
      {items.map(item => {
        const itemProducts = (productsByItem[item.id] || []).filter(p => showAll || p.is_active)
        if (itemProducts.length === 0) return null
        const group = groups.find(g => g.id === item.group_id)

        return (
          <div key={item.id} style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: NAVY, marginBottom: '6px', paddingBottom: '5px', borderBottom: `1px solid ${BORDER}` }}>
              {item.name} {group && <span style={{ color: '#aaa', fontWeight: '400' }}>({group.name})</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {itemProducts.map(p => (
                editing?.id === p.id ? (
                  <ProductForm 
                    key={p.id} 
                    value={editing} 
                    items={items} 
                    groups={groups} 
                    cbiCategories={cbiCategories}
                    onChange={setEditing} 
                    onSave={saveProduct} 
                    onCancel={() => setEditing(null)} 
                    saving={saving} 
                  />
                ) : (
                  <ProductRow key={p.id} product={p} onEdit={() => startEdit(p)} onDelete={() => handleDelete(p.id, p.name)} />
                )
              ))}
            </div>
          </div>
        )
      })}

      {/* Unassigned */}
      {unassigned.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#999', marginBottom: '6px', paddingBottom: '5px', borderBottom: `1px solid ${BORDER}` }}>
            Unassigned
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {unassigned.map(p => (
              editing?.id === p.id ? (
                <ProductForm 
                  key={p.id} 
                  value={editing} 
                  items={items} 
                  groups={groups} 
                  cbiCategories={cbiCategories}
                  onChange={setEditing} 
                  onSave={saveProduct} 
                  onCancel={() => setEditing(null)} 
                  saving={saving} 
                />
              ) : (
                <ProductRow key={p.id} product={p} onEdit={() => startEdit(p)} onDelete={() => handleDelete(p.id, p.name)} />
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── ProductRow (unchanged) ────────────────────────────────────
function ProductRow({ product: p, onEdit, onDelete }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', border: `1px solid ${BORDER}`, borderRadius: '9px', background: p.is_active ? '#fff' : '#FAFAF8', opacity: p.is_active ? 1 : 0.6 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>
          {p.name}
          {!p.is_active && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#aaa', background: '#F0EFEF', padding: '1px 6px', borderRadius: '10px' }}>Inactive</span>}
          {p.needs_own_spec_section && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#534AB7', background: '#EEEDFE', padding: '1px 6px', borderRadius: '10px' }}>Own spec section</span>}
        </div>
        {p.manufacturer && <div style={{ fontSize: '12px', color: '#888' }}>{p.manufacturer}</div>}
      </div>
      <IconBtn icon={<Edit2 size={13}/>} onClick={onEdit} title="Edit" />
      <IconBtn icon={<Trash2 size={13}/>} onClick={onDelete} title="Delete" danger />
    </div>
  )
}

// ── ProductForm with CBI Category Dropdown ────────────────────
function ProductForm({ value, items, groups, cbiCategories = [], onChange, onSave, onCancel, saving }) {
  function toggleItemAssignment(itemId) {
    onChange(v => {
      const current = v.assignedItemIds || []
      const next = current.includes(itemId)
        ? current.filter(id => id !== itemId)
        : [...current, itemId]
      return { ...v, assignedItemIds: next }
    })
  }

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

      {/* ==================== CBI CATEGORY DROPDOWN ==================== */}
      <div>
        <label style={{ 
          fontSize: '11px', 
          fontWeight: '600', 
          color: '#666', 
          marginBottom: '4px', 
          display: 'block' 
        }}>
          CBI Category <span style={{ color: '#c00' }}>*</span>
        </label>
        <select
          value={value.cbi_category_id || ''}
          onChange={e => onChange(v => ({ ...v, cbi_category_id: e.target.value || null }))}
          required
          style={inputStyle}
        >
          <option value="">— Unassigned —</option>
          {cbiCategories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.cbi_prefix} – {cat.category_label}
            </option>
          ))}
        </select>
      </div>
      {/* ============================================================ */}

      <input placeholder="Website URL" value={value.url_website || ''} onChange={e => onChange(v => ({ ...v, url_website: e.target.value }))} style={inputStyle} />
      <input placeholder="BRANZ Appraisal URL" value={value.url_branz_appraisal || ''} onChange={e => onChange(v => ({ ...v, url_branz_appraisal: e.target.value }))} style={inputStyle} />
      <input placeholder="CodeMark URL" value={value.url_codemark || ''} onChange={e => onChange(v => ({ ...v, url_codemark: e.target.value }))} style={inputStyle} />
      <input placeholder="Install Manual URL" value={value.url_install_manual || ''} onChange={e => onChange(v => ({ ...v, url_install_manual: e.target.value }))} style={inputStyle} />

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#444', cursor: 'pointer' }}>
        <input type="checkbox" checked={value.is_active !== false} onChange={e => onChange(v => ({ ...v, is_active: e.target.checked }))} />
        Active (visible for selection on projects)
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#444', cursor: 'pointer' }}>
        <input type="checkbox" checked={!!value.needs_own_spec_section} onChange={e => onChange(v => ({ ...v, needs_own_spec_section: e.target.checked }))} />
        Needs its own dedicated specification section (rather than sharing a generic clause for its CBI division)
      </label>

      {/* Assign to Items section (keep as is) */}
      <div style={{ marginTop: '4px' }}>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
          Assign to items
        </div>
        {items.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#aaa' }}>No items in the library yet.</div>
        ) : (
          <div style={{ maxHeight: '180px', overflowY: 'auto', border: `1px solid #D0CEC6`, borderRadius: '7px', background: '#fff' }}>
            {groups.map(group => {
              const groupItems = items.filter(i => i.group_id === group.id)
              if (groupItems.length === 0) return null
              return (
                <div key={group.id}>
                  <div style={{ fontSize: '10px', fontWeight: '600', color: '#aaa', textTransform: 'uppercase', padding: '6px 10px 2px', background: '#FAFAF8' }}>
                    {group.name}
                  </div>
                  {groupItems.map(item => {
                    const isChecked = (value.assignedItemIds || []).includes(item.id)
                    return (
                      <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px' }}>
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
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
        <button onClick={onSave} disabled={saving || !value.name?.trim()} style={btnSave}>
          {saving ? 'Saving…' : value.id ? 'Save changes' : 'Add product'}
        </button>
        <button onClick={onCancel} style={btnCancel}>Cancel</button>
      </div>
    </div>
  )
}