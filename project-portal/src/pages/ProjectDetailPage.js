import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, STAGES, STAGE_COLORS, FILE_TYPE_COLORS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
  ArrowLeft, Plus, Upload, Link2, Send, Trash2,
  FileText, File, AlertTriangle, AlertCircle, CheckCircle,
  ExternalLink, ChevronDown
} from 'lucide-react'
import { format, isPast, differenceInDays, parseISO } from 'date-fns'
import InviteModal, { UploadModal, LinkModal, EditProjectModal } from '../components/InviteModal'
import CompanyAccessPanel from '../components/CompanyAccessPanel'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [files, setFiles] = useState([])
  const [messages, setMessages] = useState([])
  const [tab, setTab] = useState('files')
  const [msgText, setMsgText] = useState('')
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const msgEnd = useRef(null)
  const isAdmin = profile?.role === 'admin'
  const isLead = isAdmin || members.find(m => m.user_id === profile?.id)?.role === 'lead'

  useEffect(() => { fetchAll() }, [id])
  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    const sub = supabase.channel(`project-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'project_messages', filter: `project_id=eq.${id}` },
        payload => setMessages(prev => [...prev, payload.new]))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'project_files', filter: `project_id=eq.${id}` },
        () => fetchFiles())
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [id])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchProject(), fetchMembers(), fetchFiles(), fetchMessages()])
    setLoading(false)
  }
  async function fetchProject() {
    const { data } = await supabase.from('projects').select('*').eq('id', id).single()
    setProject(data)
  }
  async function fetchMembers() {
    const { data } = await supabase.from('project_members')
      .select('*, profiles(full_name, avatar_initials, company, role)')
      .eq('project_id', id)
    setMembers(data || [])
  }
  async function fetchFiles() {
    const { data } = await supabase.from('project_files')
      .select('*, profiles(full_name)')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
    setFiles(data || [])
  }
  async function fetchMessages() {
    const { data } = await supabase.from('project_messages')
      .select('*, profiles(full_name, avatar_initials)')
      .eq('project_id', id)
      .order('created_at')
    setMessages(data || [])
  }

  async function sendMessage() {
    if (!msgText.trim()) return
    await supabase.from('project_messages').insert({ project_id: id, user_id: profile.id, body: msgText.trim() })
    setMsgText('')
  }

  async function deleteFile(fileId, storagePath) {
    if (storagePath) await supabase.storage.from('project-files').remove([storagePath])
    await supabase.from('project_files').delete().eq('id', fileId)
    fetchFiles()
  }

  async function downloadFile(f) {
    if (f.onedrive_url) { window.open(f.onedrive_url, '_blank'); return }
    const { data } = await supabase.storage.from('project-files').createSignedUrl(f.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
      Loading project…
    </div>
  )
  if (!project) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
      Project not found.
    </div>
  )

  const sc = STAGE_COLORS[project.stage] || { bg: '#F1EFE8', color: '#5F5E5A' }
  const stageIdx = STAGES.indexOf(project.stage)
  const categories = ['Project Brief', 'Drawings', 'Consultant Docs', 'General']
  const filesByCategory = categories.reduce((acc, cat) => {
    acc[cat] = files.filter(f => f.category === cat)
    return acc
  }, {})

  function deadlineBadge(deadline) {
    if (!deadline) return null
    const d = parseISO(deadline)
    const days = differenceInDays(d, new Date())
    if (isPast(d) && days < 0) return { icon: AlertTriangle, color: '#A32D2D', label: `Overdue (${format(d, 'd MMM')})` }
    if (days <= 14) return { icon: AlertCircle, color: '#854F0B', label: format(d, 'd MMM yyyy') }
    return { icon: CheckCircle, color: '#1D9E75', label: format(d, 'd MMM yyyy') }
  }

  function memberInit(m) {
    return m.profiles?.avatar_initials ||
      m.profiles?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #ECEAE4', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <button onClick={() => navigate('/')} style={S.iconBtn}><ArrowLeft size={15} /></button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em', margin: 0 }}>{project.name}</h1>
              <span style={{ ...S.badge, background: sc.bg, color: sc.color }}>{project.stage}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>{project.code}{project.client_name ? ` · ${project.client_name}` : ''}</div>
          </div>
          {isLead && (
            <button onClick={() => setShowEdit(true)} style={S.btn}>Edit project</button>
          )}
        </div>
        {/* Stage progress */}
        <div style={{ display: 'flex', gap: '3px', marginBottom: '4px' }}>
          {STAGES.map((s, i) => (
            <div key={s} title={s} style={{
              flex: 1, height: '4px', borderRadius: '2px',
              background: i < stageIdx ? '#534AB7' : i === stageIdx ? '#AFA9EC' : '#E8E6E0'
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#bbb' }}>
          {STAGES.map(s => <span key={s}>{s.split(' ')[0]}</span>)}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid #ECEAE4', background: '#fff' }}>
        {['files', 'team', 'messages'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: '13px', fontFamily: 'inherit', fontWeight: tab === t ? '500' : '400',
            color: tab === t ? '#534AB7' : '#888',
            borderBottom: `2px solid ${tab === t ? '#534AB7' : 'transparent'}`,
            textTransform: 'capitalize', transition: 'all 0.1s'
          }}>{t}</button>
        ))}
      </div>

      {/* FILES TAB */}
      {tab === 'files' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button onClick={() => setShowUpload(true)} style={S.btnPrimary}><Upload size={13} /> Upload file</button>
            <button onClick={() => setShowLink(true)} style={S.btn}><Link2 size={13} /> Add OneDrive link</button>
            {project.onedrive_url && (
              <button onClick={() => window.open(project.onedrive_url, '_blank')} style={S.btn}>
                <ExternalLink size={13} /> Open project OneDrive folder
              </button>
            )}
          </div>
          {categories.map(cat => {
            const catFiles = filesByCategory[cat]
            if (!catFiles.length) return null
            return (
              <div key={cat} style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: '500', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>{cat}</div>
                {catFiles.map(f => {
                  const ext = f.file_type || 'doc'
                  const tc = FILE_TYPE_COLORS[ext] || FILE_TYPE_COLORS.doc
                  return (
                    <div key={f.id} style={S.fileRow}
                      onClick={() => downloadFile(f)}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <FileText size={15} color="#aaa" />
                      <span style={{ flex: 1, fontSize: '13px', color: '#1a1a1a' }}>{f.name}</span>
                      <span style={{ ...S.badge, background: tc.bg, color: tc.color, fontSize: '10px' }}>{ext.toUpperCase()}</span>
                      {f.onedrive_url && <ExternalLink size={12} color="#aaa" />}
                      {(isAdmin || f.uploaded_by === profile?.id) && (
                        <button onClick={e => { e.stopPropagation(); deleteFile(f.id, f.storage_path) }} style={{ ...S.iconBtn, color: '#ddd' }}>
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
          {files.length === 0 && (
            <div style={{ textAlign: 'center', color: '#ccc', padding: '40px', fontSize: '14px' }}>No files yet. Upload or link files above.</div>
          )}
        </div>
      )}

      {/* TEAM TAB */}
      {tab === 'team' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {/* Company access section */}
          <div style={{ marginBottom: '24px', padding: '16px', background: '#FAFAF8', borderRadius: '12px', border: '0.5px solid #ECEAE4' }}>
            <CompanyAccessPanel projectId={id} isLead={isLead} />
          </div>

          {/* Individual members */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '500', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', flex: 1 }}>Individual Members</div>
            {isLead && (
              <button onClick={() => setShowInvite(true)} style={S.btnPrimary}>
                <Plus size={13} /> Add member
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {members.map(m => {
              const dl = deadlineBadge(m.deadline)
              const DlIcon = dl?.icon
              const init = memberInit(m)
              return (
                <div key={m.id} style={S.memberCard}>
                  <div style={{ ...S.memberAvatar, background: '#EEEDFE', color: '#534AB7' }}>{init}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{m.profiles?.full_name}</div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>
                      {m.consultant_type || m.profiles?.role}
                      {m.profiles?.company ? ` · ${m.profiles.company}` : ''}
                    </div>
                  </div>
                  {dl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: dl.color }}>
                      <DlIcon size={12} />
                      {dl.label}
                    </div>
                  )}
                  {m.role === 'lead' && (
                    <span style={{ ...S.badge, background: '#EEEDFE', color: '#534AB7', fontSize: '10px' }}>Lead</span>
                  )}
                </div>
              )
            })}
          </div>
          {members.length === 0 && (
            <div style={{ textAlign: 'center', color: '#ccc', padding: '20px', fontSize: '13px' }}>No individual members added yet.</div>
          )}
        </div>
      )}

      {/* MESSAGES TAB */}
      {tab === 'messages' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.map(m => {
              const isMe = m.user_id === profile?.id
              const init = m.profiles?.avatar_initials ||
                m.profiles?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
              return (
                <div key={m.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isMe ? '#EEEDFE' : '#E1F5EE', color: isMe ? '#534AB7' : '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600', flexShrink: 0 }}>{init}</div>
                  <div style={{ maxWidth: '70%' }}>
                    <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '3px', textAlign: isMe ? 'right' : 'left' }}>
                      {isMe ? 'You' : m.profiles?.full_name} · {format(new Date(m.created_at), 'd MMM, h:mm a')}
                    </div>
                    <div style={{ background: isMe ? '#EEEDFE' : '#F3F1EB', padding: '10px 13px', borderRadius: isMe ? '12px 2px 12px 12px' : '2px 12px 12px 12px', fontSize: '13px', color: '#1a1a1a', lineHeight: '1.5' }}>
                      {m.body}
                    </div>
                  </div>
                </div>
              )
            })}
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#ccc', padding: '40px', fontSize: '14px' }}>No messages yet. Start the conversation.</div>
            )}
            <div ref={msgEnd} />
          </div>
          <div style={{ padding: '12px 20px', borderTop: '0.5px solid #ECEAE4', display: 'flex', gap: '8px' }}>
            <input
              style={{ flex: 1, padding: '9px 12px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a' }}
              placeholder="Message the project team…"
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            />
            <button onClick={sendMessage} style={S.btnPrimary}><Send size={14} /></button>
          </div>
        </div>
      )}

      {showInvite && <InviteModal projectId={id} onClose={() => setShowInvite(false)} onAdded={fetchMembers} />}
      {showUpload && <UploadModal projectId={id} onClose={() => setShowUpload(false)} onUploaded={fetchFiles} />}
      {showLink && <LinkModal projectId={id} onClose={() => setShowLink(false)} onAdded={fetchFiles} />}
      {showEdit && <EditProjectModal project={project} onClose={() => setShowEdit(false)} onUpdated={() => { setShowEdit(false); fetchProject() }} />}
    </div>
  )
}

const S = {
  btn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 13px', border: '0.5px solid #D0CEC6', borderRadius: '8px', background: 'transparent', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', color: '#444' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 13px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  iconBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px', border: '0.5px solid #E0DED6', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: '#666' },
  badge: { display: 'inline-block', padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '500' },
  fileRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', marginBottom: '3px', border: '0.5px solid #ECEAE4', background: 'transparent', transition: 'background 0.1s' },
  memberCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', border: '0.5px solid #ECEAE4', borderRadius: '10px', background: '#fff' },
  memberAvatar: { width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0 }
}
