import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { MessageSquare, Upload, Search, Filter, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { DISCIPLINE_CODES } from '../lib/constants'

export default function NotificationsPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [files, setFiles] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('All')
  const [filterType, setFilterType] = useState('All') // 'All' | 'message' | 'file'
  const [filterDiscipline, setFilterDiscipline] = useState('All')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [msgRes, fileRes, projRes] = await Promise.all([
      supabase.from('project_messages')
        .select('*, profiles(full_name, avatar_initials), projects(id, name, code)')
        .neq('user_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('project_files')
        .select('*, profiles(full_name), projects(id, name, code)')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('projects').select('id, name').order('name')
    ])
    setMessages(msgRes.data || [])
    setFiles(fileRes.data || [])
    setProjects(projRes.data || [])
    setLoading(false)
  }

  const activity = [
    ...(messages.map(m => ({ ...m, _type: 'message' }))),
    ...(files.map(f => ({ ...f, _type: 'file' }))),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const filtered = activity.filter(item => {
    const matchType = filterType === 'All' || item._type === filterType
    const matchProject = filterProject === 'All' || item.projects?.id === filterProject
    const matchDiscipline = filterDiscipline === 'All' || item.discipline_code === filterDiscipline
    const matchSearch = !search ||
      item.body?.toLowerCase().includes(search.toLowerCase()) ||
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.doc_description?.toLowerCase().includes(search.toLowerCase()) ||
      item.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.projects?.name?.toLowerCase().includes(search.toLowerCase())
    return matchType && matchProject && matchDiscipline && matchSearch
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Topbar */}
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em', flex: 1 }}>Notifications</div>
        <div style={{ position: 'relative' }}>
          <Search size={13} color="#aaa" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            style={{ padding: '7px 10px 7px 28px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '220px' }}
            placeholder="Search notifications…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '8px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={13} color="#aaa" />

        {/* Type filter */}
        {['All', 'message', 'file'].map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={{
            padding: '3px 10px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
            fontFamily: 'inherit', border: '0.5px solid #D0CEC6',
            background: filterType === t ? '#1B2B4B' : 'transparent',
            color: filterType === t ? '#fff' : '#666'
          }}>{t === 'All' ? 'All' : t === 'message' ? 'Messages' : 'Files'}</button>
        ))}

        <div style={{ width: '1px', height: '16px', background: '#E0DED6' }} />

        {/* Project filter */}
        <select
          style={{ padding: '5px 8px', border: '0.5px solid #D0CEC6', borderRadius: '7px', fontSize: '12px', background: '#FAFAF8', fontFamily: 'inherit', color: '#444' }}
          value={filterProject} onChange={e => setFilterProject(e.target.value)}>
          <option value="All">All projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {/* Discipline filter (for file notifications) */}
        <select
          style={{ padding: '5px 8px', border: '0.5px solid #D0CEC6', borderRadius: '7px', fontSize: '12px', background: '#FAFAF8', fontFamily: 'inherit', color: '#444' }}
          value={filterDiscipline} onChange={e => setFilterDiscipline(e.target.value)}>
          <option value="All">All disciplines</option>
          {DISCIPLINE_CODES.map(d => <option key={d.code} value={d.code}>{d.code} — {d.label}</option>)}
        </select>

        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#aaa' }}>{filtered.length} notifications</span>
      </div>

      {/* Activity list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#ccc', padding: '40px', fontSize: '14px' }}>No notifications match your filters.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filtered.map(item => {
              const isMsg = item._type === 'message'
              const Icon = isMsg ? MessageSquare : Upload
              const iconBg = isMsg ? '#EEEDFE' : '#E1F5EE'
              const iconColor = isMsg ? '#534AB7' : '#0F6E56'

              // Recipient label for messages
              let recipientTag = null
              if (isMsg && item.recipient_type && item.recipient_type !== 'everyone') {
                recipientTag = (
                  <span style={{ fontSize: '10px', background: '#FAEEDA', color: '#854F0B', padding: '1px 6px', borderRadius: '10px', fontWeight: '500' }}>
                    {item.recipient_type === 'company' ? 'Company' : 'Direct message'}
                  </span>
                )
              }

              return (
                <div key={`${item._type}-${item.id}`}
                  onClick={() => navigate(`/projects/${item.projects?.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', border: '0.5px solid #ECEAE4', borderRadius: '10px', background: '#fff', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} color={iconColor} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '500' }}>{item.profiles?.full_name}</span>
                      <span style={{ color: '#aaa' }}>{isMsg ? 'sent a message in' : 'uploaded to'}</span>
                      <span style={{ fontWeight: '500' }}>{item.projects?.name}</span>
                      {recipientTag}
                    </div>
                    <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {isMsg ? item.body : (item.doc_description || item.name)}
                      {!isMsg && item.discipline_code && <span style={{ marginLeft: '6px', fontSize: '10px', background: '#EEEDFE', color: '#534AB7', padding: '1px 5px', borderRadius: '4px' }}>{item.discipline_code}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#bbb', flexShrink: 0 }}>
                    {format(new Date(item.created_at), 'd MMM, h:mm a')}
                  </div>
                  <ChevronRight size={14} color="#ccc" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
