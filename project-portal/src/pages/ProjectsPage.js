import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, STAGES, STAGE_COLORS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Plus, Search, AlertCircle, AlertTriangle, ChevronRight } from 'lucide-react'
import { format, isPast, differenceInDays } from 'date-fns'
import NewProjectModal from '../NewProjectModal'

export default function ProjectsPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('All')
  const [showNew, setShowNew] = useState(false)

  const isAdmin = profile?.role === 'admin'

  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    setLoading(true)
    let q = supabase
      .from('projects')
      .select(`*, project_members(user_id, role, deadline, consultant_type, profiles(full_name, avatar_initials))`)
      .order('created_at', { ascending: false })
    const { data } = await q
    setProjects(data || [])
    setLoading(false)
  }

  const filtered = projects.filter(p => {
    const matchStage = stageFilter === 'All' || p.stage === stageFilter
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
    return matchStage && matchSearch
  })

  function deadlineInfo(members) {
    const withDates = members.filter(m => m.deadline)
    if (!withDates.length) return null
    const sorted = [...withDates].sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    const next = sorted[0]
    const d = new Date(next.deadline)
    const days = differenceInDays(d, new Date())
    if (isPast(d) && days < 0) return { label: 'Overdue', status: 'overdue' }
    if (days <= 14) return { label: format(d, 'd MMM'), status: 'soon' }
    return { label: format(d, 'd MMM'), status: 'ok' }
  }

  function memberAvatars(members) {
    return members.slice(0, 4).map((m, i) => {
      const init = m.profiles?.avatar_initials ||
        m.profiles?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
      const colors = [
        ['#9FE1CB', '#085041'], ['#CECBF6', '#3C3489'],
        ['#B5D4F4', '#0C447C'], ['#F4C0D1', '#72243E']
      ]
      const [bg, color] = colors[i % colors.length]
      return (
        <div key={m.user_id} title={m.profiles?.full_name} style={{
          width: '24px', height: '24px', borderRadius: '50%', background: bg, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '9px', fontWeight: '600', marginLeft: i === 0 ? 0 : '-6px',
          border: '1.5px solid #F0EEE9', flexShrink: 0
        }}>{init}</div>
      )
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Topbar */}
      <div style={S.topbar}>
        <div style={S.topTitle}>Projects</div>
        <div style={S.searchWrap}>
          <Search size={14} color="#aaa" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            style={S.searchInput}
            placeholder="Search projects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <button onClick={() => setShowNew(true)} style={S.btnPrimary}>
            <Plus size={14} /> New project
          </button>
        )}
      </div>

      {/* Stage filters */}
      <div style={{ padding: '0 20px 12px', display: 'flex', gap: '6px', flexWrap: 'wrap', borderBottom: '0.5px solid #ECEAE4' }}>
        {['All', ...STAGES].map(s => (
          <button key={s} onClick={() => setStageFilter(s)} style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
            border: s === stageFilter ? 'none' : '0.5px solid #D0CEC6',
            background: s === stageFilter ? '#534AB7' : 'transparent',
            color: s === stageFilter ? '#fff' : '#666',
            fontFamily: 'inherit', transition: 'all 0.1s'
          }}>{s}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>Loading projects…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>
            {search ? 'No projects match your search.' : 'No projects yet.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4px' }}>
            <thead>
              <tr>
                {['Project', 'Stage', 'Progress', 'Next deadline', 'Team'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const dl = deadlineInfo(p.project_members || [])
                const sc = STAGE_COLORS[p.stage] || { bg: '#F1EFE8', color: '#5F5E5A' }
                return (
                  <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)} style={{ cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={S.td}>
                      <div style={{ fontWeight: '500', fontSize: '13px', color: '#1a1a1a' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{p.code}</div>
                    </td>
                    <td style={S.td}>
                      <span style={{ ...S.badge, background: sc.bg, color: sc.color }}>{p.stage}</span>
                    </td>
                    <td style={S.td}>
                      <div style={{ width: '80px', height: '4px', background: '#E8E6E0', borderRadius: '2px' }}>
                        <div style={{ width: `${p.progress}%`, height: '100%', background: '#534AB7', borderRadius: '2px' }} />
                      </div>
                      <div style={{ fontSize: '10px', color: '#aaa', marginTop: '3px' }}>{p.progress}%</div>
                    </td>
                    <td style={S.td}>
                      {dl ? (
                        <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px',
                          color: dl.status === 'overdue' ? '#A32D2D' : dl.status === 'soon' ? '#854F0B' : '#888',
                          fontWeight: dl.status !== 'ok' ? '500' : '400'
                        }}>
                          {dl.status === 'overdue' && <AlertTriangle size={12} />}
                          {dl.status === 'soon' && <AlertCircle size={12} />}
                          {dl.label}
                        </span>
                      ) : <span style={{ color: '#ccc', fontSize: '12px' }}>—</span>}
                    </td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {memberAvatars(p.project_members || [])}
                        {(p.project_members?.length || 0) > 4 && (
                          <div style={{ fontSize: '10px', color: '#aaa', marginLeft: '6px' }}>+{p.project_members.length - 4}</div>
                        )}
                      </div>
                    </td>
                    <td style={{ ...S.td, color: '#ccc' }}>
                      <ChevronRight size={14} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onCreated={fetchProjects} />}
    </div>
  )
}

const S = {
  topbar: {
    padding: '14px 20px', borderBottom: '0.5px solid #ECEAE4',
    display: 'flex', alignItems: 'center', gap: '12px'
  },
  topTitle: { fontSize: '16px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em', flex: 1 },
  searchWrap: { position: 'relative' },
  searchInput: {
    padding: '7px 10px 7px 30px', border: '0.5px solid #D0CEC6',
    borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8',
    fontFamily: 'inherit', color: '#1a1a1a', width: '200px'
  },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
    background: '#534AB7', color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit',
    flexShrink: 0
  },
  th: {
    textAlign: 'left', fontSize: '10px', fontWeight: '500', color: '#aaa',
    textTransform: 'uppercase', letterSpacing: '0.07em', padding: '10px 10px 6px',
    borderBottom: '0.5px solid #ECEAE4'
  },
  td: { padding: '11px 10px', borderBottom: '0.5px solid #F3F1EB', verticalAlign: 'middle' },
  badge: { display: 'inline-block', padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '500' }
}
