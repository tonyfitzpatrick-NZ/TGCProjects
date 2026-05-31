import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format, isPast, differenceInDays, parseISO } from 'date-fns'
import { Search, ChevronRight, AlertTriangle, Clock, CheckCircle, Circle, Download } from 'lucide-react'

// Engagement status logic
function getEngagementStatus(m) {
  const now = new Date()

  // Completed
  if (m.date_completed) return {
    label: 'Completed', color: '#0F6E56', bg: '#E1F5EE', priority: 5
  }

  // Overdue deadline
  if (m.deadline && isPast(parseISO(m.deadline)) && !m.date_completed) return {
    label: 'Overdue', color: '#A32D2D', bg: '#FAECE7', priority: 1
  }

  // Deadline within 14 days
  if (m.deadline && differenceInDays(parseISO(m.deadline), now) <= 14 && !m.date_completed) return {
    label: 'Due soon', color: '#854F0B', bg: '#FAEEDA', priority: 2
  }

  // Prelim returned — awaiting final
  if (m.date_preliminary_returned && !m.date_completed) return {
    label: 'Prelim received', color: '#185FA5', bg: '#E6F1FB', priority: 4
  }

  // Docs sent — awaiting response
  if (m.date_docs_sent && !m.date_preliminary_returned) return {
    label: 'Awaiting response', color: '#854F0B', bg: '#FAEEDA', priority: 2
  }

  // Engaged but docs not sent
  if (m.date_engaged && !m.date_docs_sent) return {
    label: 'Docs not sent', color: '#993C1D', bg: '#FAECE7', priority: 2
  }

  // Not yet engaged
  return {
    label: 'Not engaged', color: '#999', bg: '#F0EFEF', priority: 3
  }
}

function DateCell({ label, value, highlight }) {
  return (
    <td style={{ padding: '10px 8px', borderBottom: '0.5px solid #F3F1EB', verticalAlign: 'middle' }}>
      {value ? (
        <span style={{ fontSize: '12px', color: highlight || '#444', fontWeight: highlight ? '500' : '400' }}>
          {format(parseISO(value), 'd MMM yyyy')}
        </span>
      ) : (
        <span style={{ fontSize: '12px', color: '#ddd' }}>—</span>
      )}
    </td>
  )
}

export default function ConsultantReportPage() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterProject, setFilterProject] = useState('All')
  const [projects, setProjects] = useState([])
  const navigate = useNavigate()

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [mRes, pRes] = await Promise.all([
      supabase.from('project_members')
        .select('*, profiles(full_name, avatar_initials, companies(name), discipline), projects(id, name, code, stage)')
        .order('deadline', { ascending: true, nullsFirst: false }),
      supabase.from('projects').select('id, name').order('name')
    ])
    setMembers(mRes.data || [])
    setProjects(pRes.data || [])
    setLoading(false)
  }

  const STATUS_FILTERS = ['All', 'Overdue', 'Due soon', 'Awaiting response', 'Docs not sent', 'Prelim received', 'Not engaged', 'Completed']

  const filtered = members.filter(m => {
    const status = getEngagementStatus(m)
    const matchStatus = filterStatus === 'All' || status.label === filterStatus
    const matchProject = filterProject === 'All' || m.projects?.id === filterProject
    const matchSearch =
      m.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.profiles?.companies?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.projects?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.consultant_type?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchProject && matchSearch
  })

  // Sort: overdue first, then by deadline
  const sorted = [...filtered].sort((a, b) => {
    const sa = getEngagementStatus(a)
    const sb = getEngagementStatus(b)
    if (sa.priority !== sb.priority) return sa.priority - sb.priority
    if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline)
    if (a.deadline) return -1
    if (b.deadline) return 1
    return 0
  })

  // Stats
  const stats = {
    overdue: members.filter(m => getEngagementStatus(m).label === 'Overdue').length,
    dueSoon: members.filter(m => getEngagementStatus(m).label === 'Due soon').length,
    awaiting: members.filter(m => getEngagementStatus(m).label === 'Awaiting response').length,
    completed: members.filter(m => getEngagementStatus(m).label === 'Completed').length,
    total: members.filter(m => m.consultant_type && m.consultant_type !== 'Project Lead').length
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Topbar */}
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em', flex: 1 }}>
          Consultant Engagement Report
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={13} color="#aaa" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            style={{ padding: '7px 10px 7px 28px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '220px' }}
            placeholder="Search name, company, project…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ padding: '12px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'Overdue', count: stats.overdue, color: '#A32D2D', bg: '#FAECE7', icon: AlertTriangle },
          { label: 'Due soon', count: stats.dueSoon, color: '#854F0B', bg: '#FAEEDA', icon: Clock },
          { label: 'Awaiting', count: stats.awaiting, color: '#185FA5', bg: '#E6F1FB', icon: Circle },
          { label: 'Completed', count: stats.completed, color: '#0F6E56', bg: '#E1F5EE', icon: CheckCircle },
          { label: 'Total consultants', count: stats.total, color: '#444', bg: '#F1EFE8', icon: null },
        ].map(({ label, count, color, bg, icon: Icon }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', background: bg }}>
            {Icon && <Icon size={13} color={color} />}
            <span style={{ fontSize: '20px', fontWeight: '600', color }}>{count}</span>
            <span style={{ fontSize: '12px', color }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ padding: '8px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: '#bbb' }}>Status:</span>
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: '3px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer',
            fontFamily: 'inherit', border: '0.5px solid #D0CEC6',
            background: filterStatus === s ? '#1B2B4B' : 'transparent',
            color: filterStatus === s ? '#fff' : '#666'
          }}>{s}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#bbb' }}>Project:</span>
          <select
            style={{ padding: '4px 8px', border: '0.5px solid #D0CEC6', borderRadius: '7px', fontSize: '12px', background: '#FAFAF8', fontFamily: 'inherit', color: '#444' }}
            value={filterProject}
            onChange={e => setFilterProject(e.target.value)}>
            <option value="All">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#aaa' }}>Loading report…</div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#aaa' }}>No consultants match your filters.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: '#F7F6F3' }}>
                {['Consultant', 'Project', 'Type', 'Status', 'Engaged', 'Docs sent', 'Prelim returned', 'Completed', 'Deadline', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: '10px', fontWeight: '500', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '8px 8px 8px 10px', borderBottom: '0.5px solid #ECEAE4', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(m => {
                const status = getEngagementStatus(m)
                const init = m.profiles?.avatar_initials ||
                  m.profiles?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
                const isOverdue = status.label === 'Overdue'
                const dlColor = isOverdue ? '#A32D2D' : status.label === 'Due soon' ? '#854F0B' : '#444'

                return (
                  <tr key={m.id}
                    style={{ background: isOverdue ? '#FFFAFA' : 'transparent', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = isOverdue ? '#FFF0F0' : '#FAFAF8'}
                    onMouseLeave={e => e.currentTarget.style.background = isOverdue ? '#FFFAFA' : 'transparent'}
                    onClick={() => navigate(`/projects/${m.projects?.id}?tab=team`)}>

                    {/* Consultant */}
                    <td style={{ padding: '10px 8px 10px 10px', borderBottom: '0.5px solid #F3F1EB', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EEEDFE', color: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600', flexShrink: 0 }}>{init}</div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{m.profiles?.full_name}</div>
                          <div style={{ fontSize: '11px', color: '#aaa' }}>{m.profiles?.companies?.name}</div>
                        </div>
                      </div>
                    </td>

                    {/* Project */}
                    <td style={{ padding: '10px 8px', borderBottom: '0.5px solid #F3F1EB', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a' }}>{m.projects?.name}</div>
                      <div style={{ fontSize: '11px', color: '#bbb' }}>{m.projects?.code}</div>
                    </td>

                    {/* Type */}
                    <td style={{ padding: '10px 8px', borderBottom: '0.5px solid #F3F1EB', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: '12px', color: '#666' }}>{m.consultant_type || '—'}</span>
                    </td>

                    {/* Status badge */}
                    <td style={{ padding: '10px 8px', borderBottom: '0.5px solid #F3F1EB', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', background: status.bg, color: status.color, whiteSpace: 'nowrap' }}>
                        {isOverdue && <AlertTriangle size={10} />}
                        {status.label}
                      </span>
                    </td>

                    <DateCell value={m.date_engaged} />
                    <DateCell value={m.date_docs_sent} />
                    <DateCell value={m.date_preliminary_returned} highlight={m.date_preliminary_returned ? '#185FA5' : null} />
                    <DateCell value={m.date_completed} highlight={m.date_completed ? '#0F6E56' : null} />

                    {/* Deadline */}
                    <td style={{ padding: '10px 8px', borderBottom: '0.5px solid #F3F1EB', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      {m.deadline ? (
                        <span style={{ fontSize: '12px', color: dlColor, fontWeight: isOverdue || status.label === 'Due soon' ? '600' : '400' }}>
                          {isOverdue && <AlertTriangle size={11} style={{ marginRight: '3px', verticalAlign: '-2px' }} />}
                          {format(parseISO(m.deadline), 'd MMM yyyy')}
                        </span>
                      ) : <span style={{ fontSize: '12px', color: '#ddd' }}>—</span>}
                    </td>

                    <td style={{ padding: '10px 8px 10px 4px', borderBottom: '0.5px solid #F3F1EB', color: '#ccc' }}>
                      <ChevronRight size={14} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
