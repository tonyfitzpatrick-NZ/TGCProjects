import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, Search, ChevronDown, ChevronRight, Building2, User, Edit2, X } from 'lucide-react'
import { Modal } from '../components/NewProjectModal'
import { ROLE_OPTIONS, getRole } from '../lib/roles'

const DISCIPLINES = [
  'Architectural Documentation', 'Structural Engineering', 'Fire Design',
  'Interior Design', 'Civil Engineering', 'Quantity Surveying',
  'Geotechnical Engineering', 'Planning / Consent', 'Project Management', 'Other'
]

export default function AdminUsersPage() {
  const { profile } = useAuth()
  const [users, setUsers] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDiscipline, setFilterDiscipline] = useState('All')
  const [groupBy, setGroupBy] = useState('company')
  const [collapsed, setCollapsed] = useState({})
  const [showNewUser, setShowNewUser] = useState(false)
  const [showNewCompany, setShowNewCompany] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editingCompany, setEditingCompany] = useState(null)

  const userRole = profile?.role || ''

  // Clear and safe access control
  const isSystemAdmin = userRole === 'system_admin' || userRole === 'admin'
  const isProjectLead = userRole === 'project_lead'
  const isConsultantLead = userRole === 'consultant_lead'

  const hasFullAccess = isSystemAdmin || isProjectLead
  const canManageTeam = isConsultantLead

  // Access Control
  if (!hasFullAccess && !canManageTeam) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
        You do not have access to User Management.
      </div>
    )
  }

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [uRes, cRes] = await Promise.all([
      supabase.from('profiles').select('*, companies(id, name, discipline)').order('full_name'),
      supabase.from('companies').select('*').order('name')
    ])
    setUsers(uRes.data || [])
    setCompanies(cRes.data || [])
    setLoading(false)
  }

  async function updateUserRole(id, role) {
    if (!hasFullAccess) return
    await supabase.from('profiles').update({ role }).eq('id', id)
    fetchAll()
  }

  async function updateUserCompany(userId, companyId) {
    if (!hasFullAccess) return
    await supabase.from('profiles').update({ company_id: companyId || null }).eq('id', userId)
    fetchAll()
  }

  // Filter users for Consultant Leads (only their team)
  const filtered = users.filter(u => {
    if (isConsultantLead && !hasFullAccess) {
      const sameCompany = u.companies?.id === profile?.company_id
      const sameDiscipline = u.discipline === profile?.discipline || 
                            u.companies?.discipline === profile?.discipline
      if (!sameCompany || !sameDiscipline) return false
    }

    const matchSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.companies?.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.discipline?.toLowerCase().includes(search.toLowerCase())

    const matchDiscipline = filterDiscipline === 'All' ||
      u.discipline === filterDiscipline ||
      u.companies?.discipline === filterDiscipline

    return matchSearch && matchDiscipline
  })

  function getGroups() {
    if (groupBy === 'company') {
      const companyMap = {}
      filtered.forEach(u => {
        const key = u.companies?.name || 'TGC Homes (In-house)'
        if (!companyMap[key]) companyMap[key] = []
        companyMap[key].push(u)
      })
      return Object.entries(companyMap).sort(([a], [b]) => a === 'TGC Homes (In-house)' ? -1 : a.localeCompare(b))
    }
    if (groupBy === 'discipline') {
      const discMap = {}
      filtered.forEach(u => {
        const key = u.discipline || u.companies?.discipline || 'Unassigned'
        if (!discMap[key]) discMap[key] = []
        discMap[key].push(u)
      })
      return Object.entries(discMap).sort(([a], [b]) => a.localeCompare(b))
    }
    return [['All users', filtered]]
  }

  const groups = getGroups()

  function toggleCollapse(key) {
    setCollapsed(c => ({ ...c, [key]: !c[key] }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Topbar */}
      <div style={S.topbar}>
        <div style={S.title}>Users & Access</div>
        <div style={S.searchWrap}>
          <Search size={13} color="#aaa" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
          <input style={S.searchInput} placeholder="Search users or companies…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {hasFullAccess && (
          <>
            <button onClick={() => setShowNewCompany(true)} style={S.btn}>
              <Building2 size={13} /> New company
            </button>
            <button onClick={() => setShowNewUser(true)} style={S.btnPrimary}>
              <Plus size={13} /> Add user
            </button>
          </>
        )}
      </div>

      {/* Filter bar */}
      <div style={{ padding: '8px 20px 10px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: '#aaa', marginRight: '4px' }}>Group by:</span>
        {['company', 'discipline', 'none'].map(g => (
          <button key={g} onClick={() => setGroupBy(g)} style={{
            padding: '3px 10px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
            border: '0.5px solid #D0CEC6',
            background: groupBy === g ? '#1B2B4B' : 'transparent',
            color: groupBy === g ? '#fff' : '#666', fontFamily: 'inherit'
          }}>
            {g === 'none' ? 'None' : g.charAt(0).toUpperCase() + g.slice(1)}
          </button>
        ))}

        <div style={{ width: '1px', height: '16px', background: '#E0DED6', margin: '0 4px' }} />

        <span style={{ fontSize: '12px', color: '#aaa', marginRight: '4px' }}>Discipline:</span>
        <select style={{ ...S.select, fontSize: '12px' }} value={filterDiscipline} onChange={e => setFilterDiscipline(e.target.value)}>
          <option>All</option>
          {DISCIPLINES.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* User list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 20px' }}>
        {loading ? (
          <div style={S.empty}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>No users found.</div>
        ) : (
          groups.map(([groupName, groupUsers]) => (
            <div key={groupName} style={{ marginBottom: '16px' }}>
              {groupBy !== 'none' && (
                <div onClick={() => toggleCollapse(groupName)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer', marginBottom: '6px' }}>
                  {collapsed[groupName] ? <ChevronRight size={14} color="#aaa" /> : <ChevronDown size={14} color="#aaa" />}
                  {groupBy === 'company' ? <Building2 size={13} color="#B8952A" /> : <User size={13} color="#534AB7" />}
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>{groupName}</span>
                  <span style={{ fontSize: '12px', color: '#aaa' }}>({groupUsers.length})</span>
                </div>
              )}
              {!collapsed[groupName] && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: groupBy !== 'none' ? '22px' : '0' }}>
                  {groupUsers.map(u => (
                    <UserRow 
                      key={u.id} 
                      user={u} 
                      companies={companies} 
                      isAdmin={hasFullAccess}
                      profileId={profile?.id}
                      onRoleChange={updateUserRole}
                      onCompanyChange={updateUserCompany}
                      onEdit={() => setEditingUser(u)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {showNewCompany && <NewCompanyModal onClose={() => setShowNewCompany(false)} onCreated={fetchAll} />}
      {showNewUser && <AddUserNoteModal onClose={() => setShowNewUser(false)} />}
      {editingUser && <EditUserModal user={editingUser} companies={companies} onClose={() => setEditingUser(null)} onSaved={fetchAll} />}
      {editingCompany && <EditCompanyModal company={editingCompany} onClose={() => setEditingCompany(null)} onSaved={fetchAll} />}
    </div>
  )
}

function UserRow({ user, companies, isAdmin, profileId, onRoleChange, onCompanyChange, onEdit }) {
  const init = user.avatar_initials || user.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
  const roleInfo = getRole(user.role)

  return (
    <div style={S.userRow}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EEEDFE', color: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', flexShrink: 0 }}>
        {init}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{user.full_name}</div>
        <div style={{ fontSize: '11px', color: '#aaa' }}>
          {user.companies?.name || 'No company assigned'}
          {user.discipline && ` · ${user.discipline}`}
        </div>
      </div>

      <span style={{ 
        fontSize: '11px', padding: '2px 10px', borderRadius: '20px', 
        background: roleInfo.bg, color: roleInfo.color, fontWeight: '500', flexShrink: 0 
      }}>
        {roleInfo.label}
      </span>

      {isAdmin && user.id !== profileId && (
        <>
          <select
            value={user.role}
            onChange={e => onRoleChange(user.id, e.target.value)}
            style={S.select}
            title={roleInfo.description}
          >
            {ROLE_OPTIONS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button onClick={onEdit} style={{ ...S.iconBtn, color: '#888' }} title="Edit user">
            <Edit2 size={13} />
          </button>
        </>
      )}
    </div>
  )
}

// ── Modals (kept from your original file) ─────────────────────────────────────

function NewCompanyModal({ onClose, onCreated }) {
  // ... keep your original NewCompanyModal code here ...
}

function EditCompanyModal({ company, onClose, onSaved }) {
  // ... keep your original EditCompanyModal code here ...
}

function EditUserModal({ user, companies, onClose, onSaved }) {
  // ... keep your original EditUserModal code here ...
}

function AddUserNoteModal({ onClose }) {
  // ... keep your original AddUserNoteModal code here ...
}

function Field({ label, children, flex }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: flex || 1 }}>
    <label style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>{label}</label>
    {children}
  </div>
}

function Buttons({ onClose, loading, label }) {
  return <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
    <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
    <button type="submit" style={S.btnPrimary} disabled={loading}>{loading ? 'Saving…' : label}</button>
  </div>
}

const S = {
  topbar: { padding: '14px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', alignItems: 'center', gap: '10px' },
  title: { fontSize: '16px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em', flex: 1 },
  searchWrap: { position: 'relative' },
  searchInput: { padding: '7px 10px 7px 28px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '220px' },
  btn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 13px', border: '0.5px solid #D0CEC6', borderRadius: '8px', background: 'transparent', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', color: '#444', flexShrink: 0 },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 13px', background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
  btnSec: { padding: '8px 18px', background: 'transparent', color: '#666', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
  select: { padding: '6px 10px', border: '0.5px solid #D0CEC6', borderRadius: '7px', fontSize: '12px', background: '#FAFAF8', fontFamily: 'inherit', color: '#444', cursor: 'pointer' },
  iconBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px', border: '0.5px solid #E0DED6', borderRadius: '6px', background: 'transparent', cursor: 'pointer' },
  input: { padding: '8px 10px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '100%', boxSizing: 'border-box' },
  error: { background: '#FAECE7', color: '#993C1D', fontSize: '13px', padding: '10px 12px', borderRadius: '8px' },
  userRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', border: '0.5px solid #ECEAE4', borderRadius: '10px', background: '#fff' },
  empty: { textAlign: 'center', color: '#ccc', padding: '60px', fontSize: '14px' }
}