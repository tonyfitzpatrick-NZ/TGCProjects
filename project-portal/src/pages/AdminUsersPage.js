import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, X } from 'lucide-react'
import { Modal } from './NewProjectModal'

export default function AdminUsersPage() {
  const { profile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    const { data } = await supabase.from('profiles').select('*').order('full_name')
    setUsers(data || [])
    setLoading(false)
  }

  async function updateRole(id, role) {
    await supabase.from('profiles').update({ role }).eq('id', id)
    fetchUsers()
  }

  if (profile?.role !== 'admin') return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '14px' }}>
      Admin access required.
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1, fontSize: '16px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em' }}>Users & Access</div>
        <button onClick={() => setShowNew(true)} style={S.btnPrimary}><Plus size={13} /> Invite user</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading ? <div style={{ color: '#aaa', textAlign: 'center', padding: '40px' }}>Loading…</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {users.map(u => {
              const init = u.avatar_initials || u.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
              return (
                <div key={u.id} style={S.row}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#EEEDFE', color: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>{init}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{u.full_name}</div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>{u.company || '—'}</div>
                  </div>
                  <select value={u.role} onChange={e => updateRole(u.id, e.target.value)} style={S.select} disabled={u.id === profile?.id}>
                    <option value="consultant">Consultant</option>
                    <option value="project_lead">Project lead</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )
            })}
          </div>
        )}
        <p style={{ fontSize: '12px', color: '#aaa', marginTop: '20px', lineHeight: '1.6' }}>
          To create new user accounts, go to your Supabase dashboard → Authentication → Users → Invite user. They'll receive an email to set their password.
        </p>
      </div>
      {showNew && <InviteUserModal onClose={() => setShowNew(false)} onInvited={fetchUsers} />}
    </div>
  )
}

function InviteUserModal({ onClose, onInvited }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('consultant')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError('')
    const { error: err } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName }
    })
    if (err) { setError('Could not send invite — use Supabase dashboard directly to invite users. Error: ' + err.message); setLoading(false); return }
    setDone(true); setLoading(false)
  }

  return (
    <Modal title="Invite user" onClose={onClose}>
      {done ? (
        <div>
          <div style={{ background: '#E1F5EE', color: '#0F6E56', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
            Invite sent to {email}. They'll receive an email to set their password.
          </div>
          <button onClick={onClose} style={S.btnPrimary}>Done</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Field label="Full name *"><input style={S.input} value={fullName} onChange={e => setFullName(e.target.value)} required /></Field>
          <Field label="Email address *"><input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required /></Field>
          <Field label="Company"><input style={S.input} value={company} onChange={e => setCompany(e.target.value)} /></Field>
          <Field label="Role">
            <select style={S.input} value={role} onChange={e => setRole(e.target.value)}>
              <option value="consultant">Consultant</option>
              <option value="project_lead">Project lead</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          {error && <div style={{ background: '#FAECE7', color: '#993C1D', fontSize: '13px', padding: '10px 12px', borderRadius: '8px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
            <button type="submit" style={S.btnPrimary} disabled={loading}>{loading ? 'Sending…' : 'Send invite'}</button>
          </div>
        </form>
      )}
    </Modal>
  )
}

function Field({ label, children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
    <label style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>{label}</label>
    {children}
  </div>
}


const S = {
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 13px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  btnSec: { padding: '8px 18px', background: 'transparent', color: '#666', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
  row: { display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', border: '0.5px solid #ECEAE4', borderRadius: '10px', background: '#fff' },
  select: { padding: '6px 10px', border: '0.5px solid #D0CEC6', borderRadius: '7px', fontSize: '12px', background: '#FAFAF8', fontFamily: 'inherit', color: '#444', cursor: 'pointer' },
  input: { padding: '8px 10px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '100%', boxSizing: 'border-box' }
}
