import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, FILE_TYPE_COLORS } from '../lib/supabase'
import { FileText, ExternalLink, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

export default function UploadsPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchFiles() {
      const { data } = await supabase
        .from('project_files')
        .select('*, profiles(full_name), projects(id, name, code)')
        .order('created_at', { ascending: false })
      setFiles(data || [])
      setLoading(false)
    }
    fetchFiles()
  }, [])

  async function openFile(f) {
    if (f.onedrive_url) { window.open(f.onedrive_url, '_blank'); return }
    const { data } = await supabase.storage.from('project-files').createSignedUrl(f.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={S.topbar}>
        <div style={S.title}>All Shared Files</div>
        <div style={{ fontSize: '13px', color: '#aaa' }}>{files.length} files across all projects</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading ? (
          <div style={S.empty}>Loading files…</div>
        ) : files.length === 0 ? (
          <div style={S.empty}>No files uploaded yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['File', 'Project', 'Category', 'Uploaded by', 'Date'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
                <th style={S.th}></th>
              </tr>
            </thead>
            <tbody>
              {files.map(f => {
                const ext = f.file_type || 'doc'
                const tc = FILE_TYPE_COLORS[ext] || FILE_TYPE_COLORS.doc
                return (
                  <tr key={f.id} onClick={() => openFile(f)} style={{ cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={14} color="#aaa" />
                        <span style={{ fontSize: '13px', color: '#1a1a1a' }}>{f.name}</span>
                        <span style={{ ...S.badge, background: tc.bg, color: tc.color }}>{ext.toUpperCase()}</span>
                        {f.onedrive_url && <ExternalLink size={11} color="#bbb" />}
                      </div>
                    </td>
                    <td style={S.td}>
                      <div onClick={e => { e.stopPropagation(); navigate(`/projects/${f.projects?.id}`) }}
                        style={{ fontSize: '12px', color: '#534AB7', cursor: 'pointer', textDecoration: 'underline' }}>
                        {f.projects?.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#bbb' }}>{f.projects?.code}</div>
                    </td>
                    <td style={S.td}><span style={{ fontSize: '12px', color: '#666' }}>{f.category}</span></td>
                    <td style={S.td}><span style={{ fontSize: '12px', color: '#666' }}>{f.profiles?.full_name || '—'}</span></td>
                    <td style={S.td}><span style={{ fontSize: '12px', color: '#aaa' }}>{format(new Date(f.created_at), 'd MMM yyyy')}</span></td>
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
  empty: { textAlign: 'center', color: '#ccc', padding: '60px', fontSize: '14px' },
  th: { textAlign: 'left', fontSize: '10px', fontWeight: '500', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '10px 10px 6px', borderBottom: '0.5px solid #ECEAE4' },
  td: { padding: '10px', borderBottom: '0.5px solid #F3F1EB', verticalAlign: 'middle' },
  badge: { display: 'inline-block', padding: '1px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '500' }
}
