import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Building2, Plus, ToggleLeft, ToggleRight, Users, ChevronDown, ChevronRight } from 'lucide-react'
import { Modal } from './NewProjectModal'

export default function CompanyAccessPanel({ projectId, isLead }) {
  const [companyAccess, setCompanyAccess] = useState([])
  const [allCompanies, setAllCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [expanded, setExpanded] = useState({})

  useEffect(() => { fetchAll() }, [projectId])

  async function fetchAll() {
    setLoading(true)
    const [caRes, coRes] = await Promise.all([
      supabase.from('project_company_access')
        .select('*, companies(id, name, discipline, profiles(id, full_name, avatar_initials, role, discipline))')
        .eq('project_id', projectId),
      supabase.from('companies').select('id, name, discipline').order('name')
    ])
    setCompanyAccess(caRes.data || [])
    setAllCompanies(coRes.data || [])
    setLoading(false)
  }

  async function toggleAccess(accessId, current) {
    await supabase.from('project_company_access').update({ access_enabled: !current }).eq('id', accessId)
    fetchAll()
  }

  async function removeCompany(accessId) {
    if (!window.confirm('Remove this company from the project? All their members will lose access.')) return
    await supabase.from('project_company_access').delete().eq('id', accessId)
    fetchAll()
  }

  const assignedIds = companyAccess.map(ca => ca.company_id)
  const available = allCompanies.filter(c => !assignedIds.includes(c.id))

  if (loading) return <div style={{ color: '#aaa', fontSize: '13px', padding: '8px' }}>Loading company access…</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: '500', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', flex: 1 }}>Company Access</div>
        {isLead && available.length > 0 && (
          <button onClick={() => setShowAdd(true)} style={S.addBtn}><Plus size={12} /> Add company</button>
        )}
      </div>

      {companyAccess.length === 0 ? (
        <div style={{ fontSize: '13px', color: '#ccc', padding: '12px 0' }}>No companies assigned. Add a company to grant access to all their members at once.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {companyAccess.map(ca => {
            const members = ca.companies?.profiles || []
            const isExpanded = expanded[ca.id]
            return (
              <div key={ca.id} style={{ border: `0.5px solid ${ca.access_enabled ? '#ECEAE4' : '#F4C0D1'}`, borderRadius: '10px', overflow: 'hidden', background: ca.access_enabled ? '#fff' : '#FFF8F8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px' }}>
                  <Building2 size={15} color={ca.access_enabled ? '#B8952A' : '#bbb'} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: ca.access_enabled ? '#1a1a1a' : '#aaa' }}>{ca.companies?.name}</div>
                    <div style={{ fontSize: '11px', color: '#aaa' }}>{ca.companies?.discipline || ''} · {members.length} member{members.length !== 1 ? 's' : ''}</div>
                  </div>
                  {!ca.access_enabled && <span style={{ fontSize: '11px', color: '#993C1D', background: '#FAECE7', padding: '2px 8px', borderRadius: '20px', fontWeight: '500' }}>Access off</span>}
                  {isLead && (
                    <>
                      <button onClick={() => toggleAccess(ca.id, ca.access_enabled)} title={ca.access_enabled ? 'Disable access' : 'Enable access'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: ca.access_enabled ? '#1D9E75' : '#bbb', padding: '2px' }}>
                        {ca.access_enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                      <button onClick={() => removeCompany(ca.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', padding: '2px', fontSize: '16px' }}>×</button>
                    </>
                  )}
                  {members.length > 0 && (
                    <button onClick={() => setExpanded(e => ({ ...e, [ca.id]: !e[ca.id] }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: '2px' }}>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                </div>
                {isExpanded && members.length > 0 && (
                  <div style={{ borderTop: '0.5px solid #F3F1EB', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {members.map(m => {
                      const init = m.avatar_initials || m.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
                      return (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: ca.access_enabled ? 1 : 0.4 }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#EEEDFE', color: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '600', flexShrink: 0 }}>{init}</div>
                          <span style={{ fontSize: '12px', color: '#444' }}>{m.full_name}</span>
                          {m.discipline && <span style={{ fontSize: '11px', color: '#aaa' }}>· {m.discipline}</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <AddCompanyModal
          available={available}
          projectId={projectId}
          onClose={() => setShowAdd(false)}
          onAdded={fetchAll}
        />
      )}
    </div>
  )
}

function AddCompanyModal({ available, projectId, onClose, onAdded }) {
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { useAuth } = require('../hooks/useAuth')
  const { profile } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedId) { setError('Please select a company.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.from('project_company_access').insert({
      project_id: projectId, company_id: selectedId, access_enabled: true, added_by: profile?.id
    })
    if (err) { setError(err.message); setLoading(false); return }
    onAdded(); onClose()
  }

  return (
    <Modal title="Add company access" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
          All current and future members of the selected company will have access to this project. You can toggle access on/off at any time.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>Select company</label>
          <select style={S.input} value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            <option value="">Choose…</option>
            {available.map(c => <option key={c.id} value={c.id}>{c.name}{c.discipline ? ` — ${c.discipline}` : ''}</option>)}
          </select>
        </div>
        {error && <div style={S.error}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
          <button type="submit" style={S.btnPrimary} disabled={loading}>{loading ? 'Adding…' : 'Add company'}</button>
        </div>
      </form>
    </Modal>
  )
}

function useState(init) { return require('react').useState(init) }

const S = {
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', border: '0.5px solid #D0CEC6', borderRadius: '6px', background: 'transparent', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', color: '#444' },
  input: { padding: '8px 10px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '100%', boxSizing: 'border-box' },
  error: { background: '#FAECE7', color: '#993C1D', fontSize: '13px', padding: '10px 12px', borderRadius: '8px' },
  btnPrimary: { padding: '8px 18px', background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  btnSec: { padding: '8px 18px', background: 'transparent', color: '#666', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }
}
