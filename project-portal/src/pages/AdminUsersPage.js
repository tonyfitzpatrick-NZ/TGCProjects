import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, Search, ChevronDown, ChevronRight, Building2, User, Edit2, X, Check } from 'lucide-react'
import { Modal } from '../components/NewProjectModal'

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
  const [groupBy, setGroupBy] = useState('company') // 'company' | 'discipline' | 'none'
  const [collapsed, setCollapsed] = useState({})
  const [showNewUser, setShowNewUser] = useState(false)
  const [showNewCompany, setShowNewCompany] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editingCompany, setEditingCompany] = useState(null)

  const isAdmin = profile?.role === 'admin'

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
    await supabase.from('profiles').update({ role }).eq('id', id)
    fetchAll()
  }

  async function updateUserCompany(userId, companyId) {
    await supabase.from('profiles').update({ company_id: companyId || null }).eq('id', userId)
    fetchAll()
  }

  if (profile?.role !== 'admin') return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
      Admin access required.
    </div>
  )

  // Filter users
  const filtered = users.filter(u => {
    const matchSearch = u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.companies?.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.discipline?.toLowerCase().includes(search.toLowerCase())
    const matchDiscipline = filterDiscipline === 'All' ||
      u.discipline === filterDiscipline ||
      u.companies?.discipline === filterDiscipline
    return matchSearch && matchDiscipline
  })

  // Group users
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
        <button onClick={() => setShowNewCompany(true)} style={S.btn}><Building2 size={13} /> New company</button>
        <button onClick={() => setShowNewUser(true)} style={S.btnPrimary}><Plus size={13} /> Add user</button>
      </div>

      {/* Filter / group bar */}
      <div style={{ padding: '8px 20px 10px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: '#aaa', marginRight: '4px' }}>Group by:</span>
        {['company', 'discipline', 'none'].map(g => (
          <button key={g} onClick={() => setGroupBy(g)} style={{
            padding: '3px 10px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', border: '0.5px solid #D0CEC6',
            background: groupBy === g ? '#1B2B4B' : 'transparent', color: groupBy === g ? '#fff' : '#666', fontFamily: 'inherit'
          }}>{g === 'none' ? 'None' : g.charAt(0).toUpperCase() + g.slice(1)}</button>
        ))}
        <div style={{ width: '1px', height: '16px', background: '#E0DED6', margin: '0 4px' }} />
        <span style={{ fontSize: '12px', color: '#aaa', marginRight: '4px' }}>Discipline:</span>
        <select style={{ ...S.select, fontSize: '12px' }} value={filterDiscipline} onChange={e => setFilterDiscipline(e.target.value)}>
          <option>All</option>
          {DISCIPLINES.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Companies quick list */}
      {companies.length > 0 && groupBy === 'company' && (
        <div style={{ padding: '10px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#aaa', marginRight: '2px' }}>Companies:</span>
          {companies.map(c => (
            <div key={c.id} onClick={() => setEditingCompany(c)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: '#EEEDFE', color: '#534AB7', fontSize: '12px', cursor: 'pointer', border: '0.5px solid #AFA9EC' }}>
              <Building2 size={11} />
              {c.name}
              {c.discipline && <span style={{ color: '#AFA9EC', fontSize: '11px' }}>· {c.discipline}</span>}
            </div>
          ))}
        </div>
      )}

      {/* User list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 20px' }}>
        {loading ? <div style={S.empty}>Loading…</div> : filtered.length === 0 ? <div style={S.empty}>No users found.</div> : (
          groups.map(([groupName, groupUsers]) => (
            <div key={groupName} style={{ marginBottom: '16px' }}>
              {groupBy !== 'none' && (
                <div onClick={() => toggleCollapse(groupName)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer', marginBottom: '6px' }}>
                  {collapsed[groupName] ? <ChevronRight size={14} color="#aaa" /> : <ChevronDown size={14} color="#aaa" />}
                  {groupBy === 'company' ? <Building2 size={13} color="#B8952A" /> : <User size={13} color="#534AB7" />}
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a' }}>{groupName}</span>
                  <span style={{ fontSize: '12px', color: '#aaa' }}>({groupUsers.length})</span>
                  {groupBy === 'company' && groupName !== 'TGC Homes (In-house)' && (() => {
                    const co = companies.find(c => c.name === groupName)
                    return co?.discipline ? <span style={{ fontSize: '11px', color: '#aaa', marginLeft: '4px' }}>· {co.discipline}</span> : null
                  })()}
                </div>
              )}
              {!collapsed[groupName] && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingLeft: groupBy !== 'none' ? '22px' : '0' }}>
                  {groupUsers.map(u => (
                    <UserRow key={u.id} user={u} companies={companies} isAdmin={isAdmin}
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
        <p style={{ fontSize: '12px', color: '#bbb', marginTop: '12px', lineHeight: '1.6' }}>
          To create new accounts, go to your Supabase dashboard → Authentication → Users → Invite user.
        </p>
      </div>

      {showNewCompany && <NewCompanyModal onClose={() => setShowNewCompany(false)} onCreated={fetchAll} />}
      {showNewUser && <AddUserNoteModal onClose={() => setShowNewUser(false)} />}
      {editingUser && <EditUserModal user={editingUser} companies={companies} onClose={() => setEditingUser(null)} onSaved={fetchAll} />}
      {editingCompany && <EditCompanyModal company={editingCompany} onClose={() => setEditingCompany(null)} onSaved={fetchAll} />}
    </div>
  )
}

function UserRow({ user, companies, isAdmin, profileId, onRoleChange, onCompanyChange, onEdit }) {
  const init = user.avatar_initials || user.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
  const roleColors = { admin: ['#FAECE7', '#993C1D'], project_lead: ['#EEEDFE', '#534AB7'], consultant: ['#E1F5EE', '#0F6E56'] }
  const [bg, color] = roleColors[user.role] || roleColors.consultant
  return (
    <div style={S.userRow}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EEEDFE', color: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', flexShrink: 0 }}>{init}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{user.full_name}</div>
        <div style={{ fontSize: '11px', color: '#aaa' }}>
          {user.companies?.name || 'No company assigned'}
          {user.discipline && ` · ${user.discipline}`}
        </div>
      </div>
      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: bg, color, fontWeight: '500', flexShrink: 0, textTransform: 'capitalize' }}>
        {user.role?.replace('_', ' ')}
      </span>
      {isAdmin && user.id !== profileId && (
        <>
          <select value={user.role} onChange={e => onRoleChange(user.id, e.target.value)} style={S.select}>
            <option value="consultant">Consultant</option>
            <option value="project_lead">Project lead</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={onEdit} style={{ ...S.iconBtn, color: '#888' }} title="Edit user"><Edit2 size={13} /></button>
        </>
      )}
    </div>
  )
}

// ── MODALS ────────────────────────────────────────────────────

function NewCompanyModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', discipline: '', email: '', phone: '', website: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError('')
    const { error: err } = await supabase.from('companies').insert(form)
    if (err) { setError(err.message); setLoading(false); return }
    onCreated(); onClose()
  }

  return (
    <Modal title="New company" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Company name *" flex={2}><input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Morrison & Partners" required /></Field>
          <Field label="Discipline" flex={2}>
            <select style={S.input} value={form.discipline} onChange={e => set('discipline', e.target.value)}>
              <option value="">Select…</option>
              {DISCIPLINES.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Email"><input style={S.input} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contact@company.com" /></Field>
          <Field label="Phone"><input style={S.input} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+64 9 000 0000" /></Field>
        </div>
        <Field label="Website"><input style={S.input} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://company.com" /></Field>
        <Field label="Notes"><textarea style={{ ...S.input, minHeight: '60px', resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} /></Field>
        {error && <div style={S.error}>{error}</div>}
        <Buttons onClose={onClose} loading={loading} label="Create company" />
      </form>
    </Modal>
  )
}

function EditCompanyModal({ company, onClose, onSaved }) {
  const [form, setForm] = useState({ ...company })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError('')
    const { error: err } = await supabase.from('companies').update({ name: form.name, discipline: form.discipline, email: form.email, phone: form.phone, website: form.website, notes: form.notes }).eq('id', company.id)
    if (err) { setError(err.message); setLoading(false); return }
    onSaved(); onClose()
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${company.name}? Users assigned to this company will become unassigned.`)) return
    setDeleting(true)
    await supabase.from('companies').delete().eq('id', company.id)
    onSaved(); onClose()
  }

  return (
    <Modal title={`Edit — ${company.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Company name *" flex={2}><input style={S.input} value={form.name} onChange={e => set('name', e.target.value)} required /></Field>
          <Field label="Discipline" flex={2}>
            <select style={S.input} value={form.discipline || ''} onChange={e => set('discipline', e.target.value)}>
              <option value="">Select…</option>
              {DISCIPLINES.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Email"><input style={S.input} type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} /></Field>
          <Field label="Phone"><input style={S.input} value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></Field>
        </div>
        <Field label="Website"><input style={S.input} value={form.website || ''} onChange={e => set('website', e.target.value)} /></Field>
        <Field label="Notes"><textarea style={{ ...S.input, minHeight: '60px', resize: 'vertical' }} value={form.notes || ''} onChange={e => set('notes', e.target.value)} /></Field>
        {error && <div style={S.error}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', marginTop: '4px' }}>
          <button type="button" onClick={handleDelete} disabled={deleting} style={{ padding: '8px 14px', background: '#FAECE7', color: '#993C1D', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
            {deleting ? 'Deleting…' : 'Delete company'}
          </button>
          <Buttons onClose={onClose} loading={loading} label="Save changes" />
        </div>
      </form>
    </Modal>
  )
}

function EditUserModal({ user, companies, onClose, onSaved }) {
  const [fullName, setFullName] = useState(user.full_name || '')
  const [companyId, setCompanyId] = useState(user.company_id || '')
  const [discipline, setDiscipline] = useState(user.discipline || '')
  const [initials, setInitials] = useState(user.avatar_initials || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError('')
    const { error: err } = await supabase.from('profiles').update({
      full_name: fullName, company_id: companyId || null,
      discipline: discipline || null,
      avatar_initials: initials || fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    }).eq('id', user.id)
    if (err) { setError(err.message); setLoading(false); return }
    onSaved(); onClose()
  }

  return (
    <Modal title={`Edit — ${user.full_name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="Full name *"><input style={S.input} value={fullName} onChange={e => setFullName(e.target.value)} required /></Field>
        <Field label="Company">
          <select style={S.input} value={companyId} onChange={e => setCompanyId(e.target.value)}>
            <option value="">TGC Homes (In-house)</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}{c.discipline ? ` — ${c.discipline}` : ''}</option>)}
          </select>
        </Field>
        <Field label="Individual discipline (overrides company discipline)">
          <select style={S.input} value={discipline} onChange={e => setDiscipline(e.target.value)}>
            <option value="">Use company discipline</option>
            {DISCIPLINES.map(d => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Avatar initials">
          <input style={{ ...S.input, width: '80px' }} value={initials} onChange={e => setInitials(e.target.value.slice(0, 2).toUpperCase())} maxLength={2} placeholder="TF" />
        </Field>
        {error && <div style={S.error}>{error}</div>}
        <Buttons onClose={onClose} loading={loading} label="Save changes" />
      </form>
    </Modal>
  )
}

function AddUserNoteModal({ onClose }) {
  return (
    <Modal title="Add user" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: '#F7F6F3', borderRadius: '8px', padding: '14px', fontSize: '13px', color: '#444', lineHeight: '1.7' }}>
          To create a new user account:<br />
          <strong>1.</strong> Go to <strong>supabase.com</strong> → your project<br />
          <strong>2.</strong> Click <strong>Authentication → Users → Add user → Create new user</strong><br />
          <strong>3.</strong> Enter their email and a temporary password<br />
          <strong>4.</strong> Come back here to assign their company and role
        </div>
        <div style={{ fontSize: '12px', color: '#aaa' }}>After creating the account in Supabase, the user will appear in this list within a few seconds. You can then edit their profile to assign a company and discipline.</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={S.btnPrimary}>Got it</button>
        </div>
      </div>
    </Modal>
  )
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

function useState(init) { return require('react').useState(init) }

const S = {
  topbar: { padding: '14px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', alignItems: 'center', gap: '10px' },
  title: { fontSize: '16px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em', flex: 1 },
  searchWrap: { position: 'relative' },
  searchInput: { padding: '7px 10px 7px 28px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '200px' },
  btn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 13px', border: '0.5px solid #D0CEC6', borderRadius: '8px', background: 'transparent', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', color: '#444', flexShrink: 0 },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 13px', background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 },
  btnSec: { padding: '8px 18px', background: 'transparent', color: '#666', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
  select: { padding: '6px 10px', border: '0.5px solid #D0CEC6', borderRadius: '7px', fontSize: '12px', background: '#FAFAF8', fontFamily: 'inherit', color: '#444', cursor: 'pointer' },
  iconBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px', border: '0.5px solid #E0DED6', borderRadius: '6px', background: 'transparent', cursor: 'pointer' },
  input: { padding: '8px 10px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '100%', boxSizing: 'border-box' },
  error: { background: '#FAECE7', color: '#993C1D', fontSize: '13px', padding: '10px 12px', borderRadius: '8px' },
  userRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: '0.5px solid #ECEAE4', borderRadius: '10px', background: '#fff' },
  empty: { textAlign: 'center', color: '#ccc', padding: '60px', fontSize: '14px' }
}
