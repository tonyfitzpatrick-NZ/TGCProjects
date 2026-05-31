import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  DISCIPLINE_CODES, DOC_TYPES, DOC_STATUSES, DOC_STATUS_COLORS
} from '../lib/constants'
import { Search, FileText, ExternalLink, ChevronRight, Filter } from 'lucide-react'
import { format } from 'date-fns'

export default function DocumentsPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDiscipline, setFilterDiscipline] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterType, setFilterType] = useState('All')
  const [filterProject, setFilterProject] = useState('All')
  const [projects, setProjects] = useState([])
  const [showSuperseded, setShowSuperseded] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [fRes, pRes] = await Promise.all([
      supabase.from('project_files')
        .select('*, profiles(full_name), projects(id, name, code)')
        .order('uploaded_at', { ascending: false }),
      supabase.from('projects').select('id, name, code').order('name')
    ])
    setFiles(fRes.data || [])
    setProjects(pRes.data || [])
    setLoading(false)
  }

  async function openFile(f) {
    if (f.onedrive_url) { window.open(f.onedrive_url, '_blank'); return }
    if (f.storage_path) {
      const { data } = await supabase.storage.from('project-files').createSignedUrl(f.storage_path, 60)
      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    }
  }

  const managed = files.filter(f => f.discipline_code || f.doc_type)

  const filtered = managed.filter(f => {
    if (!showSuperseded && f.doc_status === 'Superseded') return false
    const matchSearch = !search ||
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.doc_description?.toLowerCase().includes(search.toLowerCase()) ||
      f.projects?.name?.toLowerCase().includes(search.toLowerCase())
    const matchDisc = filterDiscipline === 'All' || f.discipline_code === filterDiscipline
    const matchStatus = filterStatus === 'All' || f.doc_status === filterStatus
    const matchType = filterType === 'All' || f.doc_type === filterType
    const matchProject = filterProject === 'All' || f.projects?.id === filterProject
    return matchSearch && matchDisc && matchStatus && matchType && matchProject
  })

  // Stats
  const latest = managed.filter(f => f.is_latest_revision !== false && f.doc_status !== 'Superseded')
  const statuses = DOC_STATUSES.filter(s => s !== 'Superseded')
  const statCounts = statuses.reduce((acc, s) => {
    acc[s] = latest.filter(f => f.doc_status === s).length
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Topbar */}
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em', flex: 1 }}>
          Document Register
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={13} color="#aaa" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            style={{ padding: '7px 10px 7px 28px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '240px' }}
            placeholder="Search documents…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Status stats bar */}
      <div style={{ padding: '12px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {statuses.map(s => {
          const sc = DOC_STATUS_COLORS[s]
          return (
            <div key={s}
              onClick={() => setFilterStatus(filterStatus === s ? 'All' : s)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '8px', background: filterStatus === s ? sc.bg : '#F7F6F3', cursor: 'pointer', border: `0.5px solid ${filterStatus === s ? sc.color : 'transparent'}`, transition: 'all 0.1s' }}>
              <span style={{ fontSize: '18px', fontWeight: '600', color: sc.color }}>{statCounts[s] || 0}</span>
              <span style={{ fontSize: '11px', color: sc.color }}>{s}</span>
            </div>
          )
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#aaa' }}>
          <span>{latest.length} current documents</span>
          <span>·</span>
          <span>{managed.length} total including revisions</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '8px 20px', borderBottom: '0.5px solid #ECEAE4', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={13} color="#aaa" />
        <select style={S.filterSelect} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
          <option value="All">All projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select style={S.filterSelect} value={filterDiscipline} onChange={e => setFilterDiscipline(e.target.value)}>
          <option value="All">All disciplines</option>
          {DISCIPLINE_CODES.map(d => <option key={d.code} value={d.code}>{d.code} — {d.label}</option>)}
        </select>
        <select style={S.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="All">All types</option>
          {DOC_TYPES.map(t => <option key={t.code} value={t.code}>{t.code} — {t.label}</option>)}
        </select>
        <button onClick={() => setShowSuperseded(s => !s)}
          style={{ fontSize: '11px', color: showSuperseded ? '#534AB7' : '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' }}>
          {showSuperseded ? 'Hide superseded' : 'Show superseded'}
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        {loading ? (
          <div style={S.empty}>Loading documents…</div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>No documents match your filters.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#F7F6F3' }}>
                {['Document', 'Project', 'Discipline', 'Type', 'Rev', 'Status', 'Uploaded by', 'Date', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', fontSize: '10px', fontWeight: '500', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '8px 10px', borderBottom: '0.5px solid #ECEAE4', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => {
                const sc = DOC_STATUS_COLORS[f.doc_status] || DOC_STATUS_COLORS['For Information']
                const isSuperseded = f.doc_status === 'Superseded'
                return (
                  <tr key={f.id} style={{ opacity: isSuperseded ? 0.5 : 1, cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={S.td} onClick={() => openFile(f)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={14} color="#aaa" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{f.doc_description || f.name}</div>
                          <div style={{ fontSize: '10px', color: '#ccc', fontFamily: 'monospace', marginTop: '1px' }}>{f.name}</div>
                        </div>
                        {f.onedrive_url && <ExternalLink size={11} color="#bbb" />}
                      </div>
                    </td>
                    <td style={S.td} onClick={() => navigate(`/projects/${f.projects?.id}?tab=files`)}>
                      <div style={{ fontSize: '12px', color: '#534AB7', textDecoration: 'underline', cursor: 'pointer' }}>{f.projects?.name}</div>
                      <div style={{ fontSize: '10px', color: '#bbb' }}>{f.projects?.code}</div>
                    </td>
                    <td style={S.td}>
                      <span style={{ fontSize: '11px', background: '#EEEDFE', color: '#534AB7', padding: '2px 7px', borderRadius: '4px', fontWeight: '500' }}>{f.discipline_code || '—'}</span>
                    </td>
                    <td style={S.td}>
                      <span style={{ fontSize: '11px', color: '#666' }}>{f.doc_type || '—'}</span>
                    </td>
                    <td style={S.td}>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', background: '#F0EEE9', color: '#888', padding: '2px 6px', borderRadius: '4px' }}>{f.revision || '—'}</span>
                    </td>
                    <td style={S.td}>
                      <span style={{ ...S.badge, background: sc.bg, color: sc.color }}>{f.doc_status || '—'}</span>
                    </td>
                    <td style={S.td}>
                      <span style={{ fontSize: '12px', color: '#666' }}>{f.profiles?.full_name || '—'}</span>
                    </td>
                    <td style={S.td}>
                      <span style={{ fontSize: '11px', color: '#aaa', whiteSpace: 'nowrap' }}>
                        {f.uploaded_at ? format(new Date(f.uploaded_at), 'd MMM yyyy') : '—'}
                      </span>
                    </td>
                    <td style={{ ...S.td, color: '#ccc' }} onClick={() => navigate(`/projects/${f.projects?.id}?tab=files`)}>
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

const S = {
  filterSelect: { padding: '5px 8px', border: '0.5px solid #D0CEC6', borderRadius: '7px', fontSize: '12px', background: '#FAFAF8', fontFamily: 'inherit', color: '#444', cursor: 'pointer' },
  td: { padding: '10px', borderBottom: '0.5px solid #F3F1EB', verticalAlign: 'middle' },
  badge: { display: 'inline-block', padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '500' },
  empty: { padding: '60px', textAlign: 'center', color: '#aaa', fontSize: '14px' }
}
