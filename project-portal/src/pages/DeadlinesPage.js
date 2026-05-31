import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, STAGE_COLORS } from '../lib/supabase'
import { format, isPast, differenceInDays, parseISO } from 'date-fns'
import { AlertTriangle, AlertCircle, CheckCircle, ChevronRight, Search, Filter } from 'lucide-react'
import { STAGES, DISCIPLINE_CODES } from '../lib/constants'

export default function DeadlinesPage() {
  const [items, setItems] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('All')
  const [filterStage, setFilterStage] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All') // All | Overdue | This week | This month | Upcoming
  const [filterDiscipline, setFilterDiscipline] = useState('All')
  const navigate = useNavigate()

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [dRes, pRes] = await Promise.all([
      supabase.from('project_members')
        .select('*, projects(id, name, code, stage), profiles(full_name, avatar_initials, companies(name), discipline)')
        .not('deadline', 'is', null)
        .order('deadline'),
      supabase.from('projects').select('id, name').order('name')
    ])
    setItems(dRes.data || [])
    setProjects(pRes.data || [])
    setLoading(false)
  }

  function dlInfo(deadline) {
    const d = parseISO(deadline)
    const days = differenceInDays(d, new Date())
    if (isPast(d) && days < 0) return { icon: AlertTriangle, color: '#A32D2D', bg: '#FAECE7', label: `Overdue · ${format(d, 'd MMM yyyy')}`, group: 'Overdue', status: 'Overdue' }
    if (days <= 7) return { icon: AlertCircle, color: '#854F0B', bg: '#FAEEDA', label: `Due ${format(d, 'd MMM yyyy')} · ${days === 0 ? 'today' : `${days}d`}`, group: 'This week', status: 'This week' }
    if (days <= 30) return { icon: AlertCircle, color: '#185FA5', bg: '#E6F1FB', label: format(d, 'd MMM yyyy'), group: 'This month', status: 'This month' }
    return { icon: CheckCircle, color: '#1D9E75', bg: '#E1F5EE', label: format(d, 'd MMM yyyy'), group: 'Upcoming', status: 'Upcoming' }
  }

  const STATUS_GROUPS = ['Overdue', 'This week', 'This month', 'Upcoming']

  const filtered = items.filter(item => {
    const info = dlInfo(item.deadline)
    const matchStatus = filterStatus === 'All' || info.status === filterStatus
    const matchProject = filterProject === 'All' || item.projects?.id === filterProject
    const matchStage = filterStage === 'All' || item.projects?.stage === filterStage
    const matchDiscipline = filterDiscipline === 'All' ||
      item.consultant_type?.toLowerCase().includes(filterDiscipline.toLowerCase()) ||
      item.profiles?.discipline === filterDiscipline ||
      item.profiles?.companies?.name?.toLowerCase().includes(filterDiscipline.toLowerCase())
    const matchSearch = !search ||
      item.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.projects?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.consultant_type?.toLowerCase().includes(search.toLowerCase()) ||
      item.profiles?.companies?.name?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchProject && matchStage && matchDiscipline && matchSearch
  })

  // Group filtered items
  const groups = STATUS_GROUPS.reduce((acc, g) => { acc[g] = []; return acc }, {})
  filtered.forEach(item => {
    const info = dlInfo(item.deadline)
    groups[info.group].push({ ...item, dlInfo: info })
  })

  // Stats
  const stats = STATUS_GROUPS.map(g => ({
    label: g,
    count: items.filter(i => dlInfo(i.deadline).group === g).length
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Topbar */}
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em', flex: 1 }}>Deadlines</div>
        <div style={{ position: 'relative' }}>
          <Search size={13} color="#aaa" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            style={{ padding: '7px 10px 7px 28px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '200px' }}
            placeholder="Search deadlines…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats bar — clickable to filter */}
      <div style={{ padding: '10px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <div onClick={() => setFilterStatus('All')} style={{ ...statCard('#F7F6F3', '#444'), border: `1.5px solid ${filterStatus === 'All' ? '#1B2B4B' : 'transparent'}` }}>
          <span style={{ fontSize: '20px', fontWeight: '700', color: '#1B2B4B' }}>{items.length}</span>
          <span style={{ fontSize: '11px', color: '#666' }}>All</span>
        </div>
        {[
          { g: 'Overdue', color: '#A32D2D', bg: '#FAECE7' },
          { g: 'This week', color: '#854F0B', bg: '#FAEEDA' },
          { g: 'This month', color: '#185FA5', bg: '#E6F1FB' },
          { g: 'Upcoming', color: '#1D9E75', bg: '#E1F5EE' },
        ].map(({ g, color, bg }) => (
          <div key={g} onClick={() => setFilterStatus(filterStatus === g ? 'All' : g)}
            style={{ ...statCard(bg, color), border: `1.5px solid ${filterStatus === g ? color : 'transparent'}` }}>
            <span style={{ fontSize: '20px', fontWeight: '700', color }}>{groups[g]?.length || 0}</span>
            <span style={{ fontSize: '11px', color }}>{g}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ padding: '8px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={13} color="#aaa" />
        <select style={S.sel} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
          <option value="All">All projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select style={S.sel} value={filterStage} onChange={e => setFilterStage(e.target.value)}>
          <option value="All">All stages</option>
          {STAGES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select style={S.sel} value={filterDiscipline} onChange={e => setFilterDiscipline(e.target.value)}>
          <option value="All">All disciplines</option>
          {DISCIPLINE_CODES.map(d => <option key={d.code} value={d.code}>{d.label}</option>)}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#aaa' }}>{filtered.length} deadline{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grouped list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading ? <div style={S.empty}>Loading…</div> :
         filtered.length === 0 ? <div style={S.empty}>No deadlines match your filters.</div> : (
          STATUS_GROUPS.map(g => {
            const gItems = groups[g]
            if (!gItems.length) return null
            return (
              <div key={g} style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: '500', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>{g}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {gItems.map(item => {
                    const { icon: Icon, color, label } = item.dlInfo
                    const sc = STAGE_COLORS[item.projects?.stage] || { bg: '#F1EFE8', color: '#5F5E5A' }
                    const init = item.profiles?.avatar_initials ||
                      item.profiles?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
                    return (
                      <div key={item.id}
                        onClick={() => navigate(`/projects/${item.projects?.id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', border: '0.5px solid #ECEAE4', borderRadius: '10px', background: '#fff', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#EEEDFE', color: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', flexShrink: 0 }}>{init}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '500', fontSize: '13px', color: '#1a1a1a' }}>{item.profiles?.full_name}</div>
                          <div style={{ fontSize: '12px', color: '#aaa' }}>
                            {item.consultant_type}
                            {item.profiles?.companies?.name ? ` · ${item.profiles.companies.name}` : ''}
                            {' · '}{item.projects?.name}
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: sc.bg, color: sc.color, fontWeight: '500', flexShrink: 0 }}>{item.projects?.stage}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color, fontSize: '12px', fontWeight: '500', flexShrink: 0 }}>
                          <Icon size={13} />
                          {label}
                        </div>
                        <ChevronRight size={14} color="#ccc" />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function statCard(bg, color) {
  return {
    display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
    borderRadius: '8px', background: bg, cursor: 'pointer', transition: 'all 0.1s'
  }
}

const S = {
  sel: { padding: '5px 8px', border: '0.5px solid #D0CEC6', borderRadius: '7px', fontSize: '12px', background: '#FAFAF8', fontFamily: 'inherit', color: '#444', cursor: 'pointer' },
  empty: { textAlign: 'center', color: '#ccc', padding: '60px', fontSize: '14px' }
}
