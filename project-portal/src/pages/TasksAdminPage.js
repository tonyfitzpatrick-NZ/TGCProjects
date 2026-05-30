import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TASK_STATUSES, TASK_STATUS_COLORS, STAGES } from '../lib/constants'
import { Search, AlertTriangle, Clock, Link2, ChevronRight } from 'lucide-react'
import { format, isPast, differenceInDays, parseISO } from 'date-fns'

export default function TasksAdminPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterStage, setFilterStage] = useState('All')
  const [sortBy, setSortBy] = useState('deadline')
  const navigate = useNavigate()

  useEffect(() => { fetchTasks() }, [])

  async function fetchTasks() {
    setLoading(true)
    const { data } = await supabase.from('tasks')
      .select('*, projects(id,name,code,stage), assigned_company:companies(id,name,discipline), assigned_user:profiles!tasks_assigned_user_id_fkey(id,full_name), depends_on_task:tasks!tasks_depends_on_fkey(id,title,status)')
      .order('deadline', { ascending: true, nullsFirst: false })
    setTasks(data || [])
    setLoading(false)
  }

  const filtered = tasks.filter(t => {
    const matchSearch = t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.projects?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.assigned_company?.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.assigned_user?.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'All' || t.status === filterStatus
    const matchStage = filterStage === 'All' || t.stage === filterStage || t.projects?.stage === filterStage
    return matchSearch && matchStatus && matchStage
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'deadline') {
      if (!a.deadline) return 1; if (!b.deadline) return -1
      return new Date(a.deadline) - new Date(b.deadline)
    }
    if (sortBy === 'status') return TASK_STATUSES.indexOf(a.status) - TASK_STATUSES.indexOf(b.status)
    if (sortBy === 'company') return (a.assigned_company?.name || 'zzz').localeCompare(b.assigned_company?.name || 'zzz')
    if (sortBy === 'project') return (a.projects?.name || '').localeCompare(b.projects?.name || '')
    return 0
  })

  function dlBadge(deadline) {
    if (!deadline) return null
    const d = parseISO(deadline)
    const days = differenceInDays(d, new Date())
    if (isPast(d) && days < 0) return { color: '#A32D2D', label: `Overdue · ${format(d, 'd MMM')}`, Icon: AlertTriangle }
    if (days <= 7) return { color: '#854F0B', label: `${format(d, 'd MMM')} · ${days}d`, Icon: Clock }
    return { color: '#888', label: format(d, 'd MMM yyyy'), Icon: null }
  }

  const stats = {
    total: tasks.length,
    open: tasks.filter(t => t.status === 'Open').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    forReview: tasks.filter(t => t.status === 'For Review').length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    overdue: tasks.filter(t => t.deadline && isPast(parseISO(t.deadline)) && t.status !== 'Completed').length
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={S.topbar}>
        <div style={S.title}>All Tasks</div>
        <div style={S.searchWrap}>
          <Search size={13} color="#aaa" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
          <input style={S.searchInput} placeholder="Search tasks, projects, companies…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ padding: '10px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[['Total', stats.total, '#666'], ['Open', stats.open, '#5F5E5A'], ['In Progress', stats.inProgress, '#185FA5'],
          ['For Review', stats.forReview, '#854F0B'], ['Completed', stats.completed, '#0F6E56'], ['Overdue', stats.overdue, '#A32D2D']
        ].map(([label, count, color]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '18px', fontWeight: '600', color }}>{count}</span>
            <span style={{ fontSize: '11px', color: '#aaa' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ padding: '8px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#bbb' }}>Status:</span>
          {['All', ...TASK_STATUSES].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ ...S.chip, background: filterStatus === s ? '#1B2B4B' : 'transparent', color: filterStatus === s ? '#fff' : '#666', border: `0.5px solid ${filterStatus === s ? '#1B2B4B' : '#D0CEC6'}` }}>{s}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#bbb' }}>Stage:</span>
          <select style={{ ...S.select }} value={filterStage} onChange={e => setFilterStage(e.target.value)}>
            <option>All</option>
            {STAGES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: 'auto' }}>
          <span style={{ fontSize: '11px', color: '#bbb' }}>Sort:</span>
          <select style={S.select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="deadline">Deadline</option>
            <option value="status">Status</option>
            <option value="company">Company</option>
            <option value="project">Project</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        {loading ? <div style={S.empty}>Loading tasks…</div> : sorted.length === 0 ? <div style={S.empty}>No tasks found.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4px' }}>
            <thead>
              <tr>
                {['Task', 'Project', 'Assigned to', 'Stage', 'Status', 'Hours', 'Deadline', ''].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(task => {
                const tc = TASK_STATUS_COLORS[task.status] || TASK_STATUS_COLORS['Open']
                const dl = dlBadge(task.deadline)
                const depBlocked = task.depends_on_task && task.depends_on_task.status !== 'Completed'
                return (
                  <tr key={task.id} style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/projects/${task.projects?.id}?tab=tasks`)}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={S.td}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {task.title}
                        {depBlocked && <Link2 size={11} color="#993C1D" title={`Blocked by: ${task.depends_on_task.title}`} />}
                      </div>
                      {task.description && <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.description}</div>}
                    </td>
                    <td style={S.td}>
                      <div style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a' }}>{task.projects?.name}</div>
                      <div style={{ fontSize: '11px', color: '#bbb' }}>{task.projects?.code}</div>
                    </td>
                    <td style={S.td}>
                      <div style={{ fontSize: '12px', color: '#444' }}>{task.assigned_company?.name || '—'}</div>
                      {task.assigned_user && <div style={{ fontSize: '11px', color: '#aaa' }}>→ {task.assigned_user.full_name}</div>}
                    </td>
                    <td style={S.td}><span style={{ fontSize: '11px', color: '#888' }}>{task.stage || task.projects?.stage || '—'}</span></td>
                    <td style={S.td}>
                      <span style={{ ...S.badge, background: tc.bg, color: tc.color }}>{task.status}</span>
                    </td>
                    <td style={S.td}><span style={{ fontSize: '12px', color: '#888' }}>{task.hours_allowed ? `${task.hours_allowed}h` : '—'}</span></td>
                    <td style={S.td}>
                      {dl ? (
                        <span style={{ fontSize: '12px', color: dl.color, display: 'flex', alignItems: 'center', gap: '3px', fontWeight: dl.color !== '#888' ? '500' : '400' }}>
                          {dl.Icon && <dl.Icon size={11} />}{dl.label}
                        </span>
                      ) : <span style={{ fontSize: '12px', color: '#ccc' }}>—</span>}
                    </td>
                    <td style={{ ...S.td, color: '#ccc' }}><ChevronRight size={14} /></td>
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

const S = {
  topbar: { padding: '14px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', alignItems: 'center', gap: '12px' },
  title: { fontSize: '16px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em', flex: 1 },
  searchWrap: { position: 'relative' },
  searchInput: { padding: '7px 10px 7px 28px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '240px' },
  chip: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' },
  select: { padding: '4px 8px', border: '0.5px solid #D0CEC6', borderRadius: '7px', fontSize: '12px', background: '#FAFAF8', fontFamily: 'inherit', color: '#444' },
  th: { textAlign: 'left', fontSize: '10px', fontWeight: '500', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '10px 10px 6px', borderBottom: '0.5px solid #ECEAE4' },
  td: { padding: '10px', borderBottom: '0.5px solid #F3F1EB', verticalAlign: 'middle' },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '500' },
  empty: { padding: '60px', textAlign: 'center', color: '#aaa', fontSize: '14px' }
}
