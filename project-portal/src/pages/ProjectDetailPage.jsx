import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, STAGES, STAGE_COLORS, FILE_TYPE_COLORS, TASK_STATUS_COLORS } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
  ArrowLeft, Plus, Upload, Link2, Send, Trash2,
  FileText, AlertTriangle, AlertCircle, CheckCircle,
  ExternalLink, Home, CheckSquare, MessageSquare, Users
} from 'lucide-react'
import { format, isPast, differenceInDays, parseISO } from 'date-fns'
import InviteModal, { UploadModal, LinkModal } from '../components/InviteModal'
import NewProjectModal, { Modal } from '../components/NewProjectModal'
import CompanyAccessPanel from '../components/CompanyAccessPanel'
import TasksPanel from '../components/TasksPanel'
import DocumentRegister from '../components/DocumentRegister'
import MessagesPanel from '../components/MessagesPanel'
import ApplicationsPanel from '../components/ApplicationsPanel'
import { ScheduleTab } from '../components/schedule'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [files, setFiles] = useState([])
  const [tasks, setTasks] = useState([])
  const [companies, setCompanies] = useState([])
  const [tab, setTab] = useState(searchParams.get('tab') || 'overview')
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showLink, setShowLink] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const isAdmin = profile?.role === 'admin'
  const isLead = isAdmin || members.find(m => m.user_id === profile?.id)?.role === 'lead'

  useEffect(() => { fetchAll() }, [id])

  function switchTab(t) { setTab(t); setSearchParams({ tab: t }) }

  async function fetchAll() {
    setLoading(true)
    try {
      await Promise.all([fetchProject(), fetchMembers(), fetchFiles(), fetchTasks(), fetchCompanies()])
    } catch (err) {
      console.error('fetchAll error:', err)
    } finally {
      setLoading(false)
    }
  }
  async function fetchProject() {
    const { data } = await supabase.from('projects').select('*').eq('id', id).single()
    setProject(data)
  }
  async function fetchMembers() {
    const { data } = await supabase.from('project_members')
      .select('*, profiles(full_name, avatar_initials, company_id, companies(name), discipline)')
      .eq('project_id', id)
    setMembers(data || [])
  }
  async function fetchFiles() {
    const { data } = await supabase.from('project_files')
      .select('*, profiles(full_name)')
      .eq('project_id', id).order('created_at', { ascending: false })
    setFiles(data || [])
  }
  async function fetchCompanies() {
    const { data } = await supabase.from('companies').select('id,name,discipline').order('name')
    setCompanies(data || [])
  }
  async function fetchTasks() {
    const { data } = await supabase.from('tasks')
      .select('*, assigned_company:companies(name), assigned_user:profiles(full_name)')
      .eq('project_id', id).order('created_at')
    setTasks(data || [])
  }

  async function deleteFile(fileId, storagePath) {
    if (storagePath) await supabase.storage.from('project-files').remove([storagePath])
    await supabase.from('project_files').delete().eq('id', fileId)
    fetchFiles()
  }

  async function openFile(f) {
    if (f.onedrive_url) { window.open(f.onedrive_url, '_blank'); return }
    const { data } = await supabase.storage.from('project-files').createSignedUrl(f.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  if (loading) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>Loading project…</div>
  if (!project) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>Project not found.</div>

  const sc = STAGE_COLORS[project.stage] || { bg: '#F1EFE8', color: '#5F5E5A' }
  const stageIdx = STAGES.indexOf(project.stage)
  const coverUrl = project.cover_image_path
    ? supabase.storage.from('project-covers').getPublicUrl(project.cover_image_path).data?.publicUrl
    : null

  // ── TABS — 'schedule' added after 'applications' ──────────────
  const TABS = ['overview', 'files', 'tasks', 'applications', 'schedule', 'team', 'messages']

  // Derive userRole string for ScheduleTab
  const scheduleUserRole = isAdmin ? 'admin' : isLead ? 'lead' : 'consultant'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ borderBottom: '0.5px solid #ECEAE4', background: '#fff' }}>
        <div style={{ padding: '14px 20px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => navigate('/')} style={S.iconBtn}><ArrowLeft size={15} /></button>
          {coverUrl && <img src={coverUrl} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', letterSpacing: '-0.02em', margin: 0 }}>{project.name}</h1>
              <span style={{ ...S.badge, background: sc.bg, color: sc.color }}>{project.stage}</span>
              {project.status && project.status !== 'Active' && (
                <span style={{ ...S.badge, background: '#F0EFEF', color: '#999' }}>{project.status}</span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
              {project.code}{project.client_name ? ` · ${project.client_name}` : ''}{project.address ? ` · ${project.address}` : ''}
            </div>
          </div>
          {isLead && <button onClick={() => setShowEdit(true)} style={S.btn}>Edit project</button>}
        </div>

        {/* Stage progress bar */}
        <div style={{ padding: '0 20px 6px' }}>
          <div style={{ display: 'flex', gap: '3px', marginBottom: '3px' }}>
            {STAGES.map((s, i) => (
              <div key={s} title={s} style={{
                flex: 1, height: '4px', borderRadius: '2px',
                background: i < stageIdx ? '#1B2B4B' : i === stageIdx ? '#B8952A' : '#E8E6E0'
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#bbb' }}>
            {STAGES.map(s => <span key={s}>{s.split(' ')[0]}</span>)}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', paddingLeft: '8px' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => switchTab(t)} style={{
              padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: '13px', fontFamily: 'inherit', fontWeight: tab === t ? '500' : '400',
              color: tab === t ? '#1B2B4B' : '#888',
              borderBottom: `2px solid ${tab === t ? '#B8952A' : 'transparent'}`,
              textTransform: 'capitalize', transition: 'all 0.1s'
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
      {tab === 'overview' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>

            {/* Project info card */}
            <div style={S.card}>
              <CardHeader title="Project Info" icon={<Home size={14} />} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  ['Code', project.code], ['Client', project.client_name],
                  ['Address', project.address], ['Legal description', project.legal_description],
                  ['Site area', project.site_area ? `${project.site_area} m²` : null],
                  ['TA', project.territorial_authority], ['TA Zone', project.ta_zone],
                  ['BCA', project.building_consent_authority],
                  ['Wind zone', project.wind_zone], ['Earthquake zone', project.earthquake_zone],
                  ['Exposure zone', project.exposure_zone],
                  ['Deadline', project.project_deadline ? format(parseISO(project.project_deadline), 'd MMM yyyy') : null],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', fontSize: '12px', gap: '8px' }}>
                    <span style={{ color: '#aaa', width: '120px', flexShrink: 0 }}>{label}</span>
                    <span style={{ color: '#1a1a1a' }}>{value}</span>
                  </div>
                ))}
                {project.description && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '6px', lineHeight: '1.6', borderTop: '0.5px solid #F3F1EB', paddingTop: '8px' }}>
                    {project.description}
                  </div>
                )}
              </div>
            </div>

            {/* Files card */}
            <div style={{ ...S.card, cursor: 'pointer' }} onClick={() => switchTab('files')}>
              <CardHeader title="Recent Files" icon={<FileText size={14} />} count={files.length} onMore={() => switchTab('files')} />
              {files.slice(0, 5).map(f => {
                const ext = f.file_type || 'doc'
                const tc = FILE_TYPE_COLORS[ext] || { bg: '#F1EFE8', color: '#5F5E5A' }
                return (
                  <div key={f.id} onClick={e => { e.stopPropagation(); openFile(f) }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '0.5px solid #F3F1EB', cursor: 'pointer' }}>
                    <FileText size={13} color="#aaa" />
                    <span style={{ flex: 1, fontSize: '12px', color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
                    <span style={{ ...S.badge, background: tc.bg, color: tc.color, fontSize: '10px' }}>{ext.toUpperCase()}</span>
                  </div>
                )
              })}
              {files.length === 0 && <div style={S.emptyCard}>No files yet</div>}
            </div>

            {/* Tasks card */}
            <div style={{ ...S.card, cursor: 'pointer' }} onClick={() => switchTab('tasks')}>
              <CardHeader title="Tasks" icon={<CheckSquare size={14} />} count={tasks.length} onMore={() => switchTab('tasks')} />
              {tasks.slice(0, 5).map(t => {
                const tc = TASK_STATUS_COLORS[t.status] || TASK_STATUS_COLORS['Open']
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '0.5px solid #F3F1EB' }}>
                    <span style={{ ...S.badge, background: tc.bg, color: tc.color, fontSize: '10px', flexShrink: 0 }}>{t.status}</span>
                    <span style={{ flex: 1, fontSize: '12px', color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
                    {t.assigned_company && <span style={{ fontSize: '11px', color: '#aaa', flexShrink: 0 }}>{t.assigned_company.name}</span>}
                  </div>
                )
              })}
              {tasks.length === 0 && <div style={S.emptyCard}>No tasks yet</div>}
            </div>

            {/* Team card */}
            <div style={{ ...S.card, cursor: 'pointer' }} onClick={() => switchTab('team')}>
              <CardHeader title="Team" icon={<Users size={14} />} count={members.length} onMore={() => switchTab('team')} />
              {members.slice(0, 5).map(m => {
                const init = m.profiles?.avatar_initials || m.profiles?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
                const dl = m.deadline ? deadlineBadge(m.deadline) : null
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '0.5px solid #F3F1EB' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#EEEDFE', color: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: '600', flexShrink: 0 }}>{init}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: '500', color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.profiles?.full_name}</div>
                      <div style={{ fontSize: '11px', color: '#aaa' }}>{m.consultant_type}</div>
                    </div>
                    {dl && <span style={{ fontSize: '11px', color: dl.color, flexShrink: 0 }}>{dl.label}</span>}
                  </div>
                )
              })}
              {members.length === 0 && <div style={S.emptyCard}>No team members yet</div>}
            </div>

            {/* Messages card */}
            <div style={{ ...S.card, cursor: 'pointer', gridColumn: 'span 2' }} onClick={() => switchTab('messages')}>
              <CardHeader title="Message Threads" icon={<MessageSquare size={14} />} onMore={() => switchTab('messages')} />
              <div style={{ fontSize: '13px', color: '#aaa', textAlign: 'center', padding: '16px 0' }}>
                Click to view message threads for this project
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FILES TAB ──────────────────────────────────────────── */}
      {tab === 'files' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {project.onedrive_url && (
            <div style={{ marginBottom: '14px' }}>
              <button onClick={() => window.open(project.onedrive_url, '_blank')} style={S.btn}>
                <ExternalLink size={13} /> Open project OneDrive folder
              </button>
            </div>
          )}
          <DocumentRegister
            projectId={id}
            projectCode={project.code}
            isLead={isLead}
          />
        </div>
      )}

      {/* ── TASKS TAB ──────────────────────────────────────────── */}
      {tab === 'tasks' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <TasksPanel projectId={id} isLead={isLead} onTasksChanged={fetchTasks} />
        </div>
      )}

      {/* ── APPLICATIONS TAB ────────────────────────────────────── */}
      {tab === 'applications' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <ApplicationsPanel
            projectId={id}
            projectCode={project.code}
            isLead={isLead}
          />
        </div>
      )}

      {/* ── SCHEDULE TAB ────────────────────────────────────────── */}
      {tab === 'schedule' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <ScheduleTab
            projectId={id}
            userRole={scheduleUserRole}
          />
        </div>
      )}

      {/* ── TEAM TAB ───────────────────────────────────────────── */}
      {tab === 'team' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{ marginBottom: '24px', padding: '16px', background: '#FAFAF8', borderRadius: '12px', border: '0.5px solid #ECEAE4' }}>
            <CompanyAccessPanel projectId={id} isLead={isLead} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '500', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', flex: 1 }}>Individual Members</div>
            {isLead && <button onClick={() => setShowInvite(true)} style={S.btnPrimary}><Plus size={13} /> Add member</button>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {members.map(m => (
              <MemberCard key={m.id} member={m} isLead={isLead} profile={profile}
                onEdit={() => setEditingMember(m)} onRefresh={fetchMembers} />
            ))}
          </div>
          {members.length === 0 && <div style={{ textAlign: 'center', color: '#ccc', padding: '20px', fontSize: '13px' }}>No individual members added yet.</div>}
        </div>
      )}

      {/* ── MESSAGES TAB ───────────────────────────────────────── */}
      {tab === 'messages' && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <MessagesPanel
            projectId={id}
            members={members}
            isLead={isLead}
          />
        </div>
      )}

      {showInvite && <InviteModal projectId={id} onClose={() => setShowInvite(false)} onAdded={fetchMembers} />}
      {showUpload && <UploadModal projectId={id} onClose={() => setShowUpload(false)} onUploaded={fetchFiles} />}
      {showLink && <LinkModal projectId={id} onClose={() => setShowLink(false)} onAdded={fetchFiles} />}
      {showEdit && <NewProjectModal project={project} onClose={() => setShowEdit(false)} onCreated={() => { setShowEdit(false); fetchProject() }} />}
      {editingMember && <EditMemberModal member={editingMember} onClose={() => setEditingMember(null)} onSaved={fetchMembers} />}
    </div>
  )
}

function CardHeader({ title, icon, count, onMore }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', paddingBottom: '8px', borderBottom: '0.5px solid #F3F1EB' }}>
      <span style={{ color: '#B8952A' }}>{icon}</span>
      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', flex: 1 }}>{title}</span>
      {count !== undefined && <span style={{ fontSize: '11px', color: '#aaa' }}>{count} total</span>}
    </div>
  )
}

function MemberCard({ member: m, isLead, profile, onEdit, onRefresh }) {
  const init = m.profiles?.avatar_initials || m.profiles?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'
  const dl = m.deadline ? deadlineBadge(m.deadline) : null

  async function removeMember() {
    if (!window.confirm(`Remove ${m.profiles?.full_name} from this project?`)) return
    await supabase.from('project_members').delete().eq('id', m.id)
    onRefresh()
  }

  return (
    <div style={S.memberCard}>
      <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#EEEDFE', color: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>{init}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1a1a1a' }}>{m.profiles?.full_name}</div>
        <div style={{ fontSize: '11px', color: '#aaa' }}>
          {m.consultant_type}{m.profiles?.companies?.name ? ` · ${m.profiles.companies.name}` : ''}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
          {m.date_engaged && <span style={{ fontSize: '11px', color: '#888' }}>Engaged: {format(parseISO(m.date_engaged), 'd MMM yyyy')}</span>}
          {m.date_docs_sent && <span style={{ fontSize: '11px', color: '#888' }}>Docs sent: {format(parseISO(m.date_docs_sent), 'd MMM yyyy')}</span>}
          {m.date_preliminary_returned && <span style={{ fontSize: '11px', color: '#0F6E56' }}>Prelim returned: {format(parseISO(m.date_preliminary_returned), 'd MMM yyyy')}</span>}
          {m.date_completed && <span style={{ fontSize: '11px', color: '#0F6E56' }}>Completed: {format(parseISO(m.date_completed), 'd MMM yyyy')}</span>}
        </div>
      </div>
      {dl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: dl.color, fontWeight: dl.status !== 'ok' ? '500' : '400', flexShrink: 0 }}>
          {dl.status === 'overdue' && <AlertTriangle size={12} />}
          {dl.status === 'soon' && <AlertCircle size={12} />}
          {dl.status === 'ok' && <CheckCircle size={12} />}
          {dl.label}
        </div>
      )}
      {m.role === 'lead' && <span style={{ ...S.badge, background: '#EEEDFE', color: '#534AB7', fontSize: '10px', flexShrink: 0 }}>Lead</span>}
      {isLead && (
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={onEdit} style={S.iconBtn} title="Edit">✎</button>
          {m.user_id !== profile?.id && (
            <button onClick={removeMember} style={{ ...S.iconBtn, color: '#ddd' }} title="Remove"><Trash2 size={12} /></button>
          )}
        </div>
      )}
    </div>
  )
}

function EditMemberModal({ member: m, onClose, onSaved }) {
  const [form, setForm] = useState({
    consultant_type: m.consultant_type || '',
    role: m.role || 'consultant',
    deadline: m.deadline || '',
    date_engaged: m.date_engaged || '',
    date_docs_sent: m.date_docs_sent || '',
    date_preliminary_returned: m.date_preliminary_returned || '',
    date_completed: m.date_completed || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError('')
    const { error: err } = await supabase.from('project_members').update({
      consultant_type: form.consultant_type,
      role: form.role,
      deadline: form.deadline || null,
      date_engaged: form.date_engaged || null,
      date_docs_sent: form.date_docs_sent || null,
      date_preliminary_returned: form.date_preliminary_returned || null,
      date_completed: form.date_completed || null
    }).eq('id', m.id)
    if (err) { setError(err.message); setLoading(false); return }
    onSaved(); onClose()
  }

  return (
    <Modal title={`Edit — ${m.profiles?.full_name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ fontSize: '12px', color: '#aaa', background: '#F7F6F3', padding: '10px 12px', borderRadius: '8px' }}>
          Updating engagement dates and deadline for <strong>{m.profiles?.full_name}</strong> on this project.
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Consultant type">
            <input style={S.input} value={form.consultant_type} onChange={e => set('consultant_type', e.target.value)} />
          </Field>
          <Field label="Portal role">
            <select style={S.input} value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="consultant">Consultant</option>
              <option value="lead">Project lead</option>
            </select>
          </Field>
        </div>
        <SectionLabel>Engagement tracking</SectionLabel>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Date engaged"><input style={S.input} type="date" value={form.date_engaged} onChange={e => set('date_engaged', e.target.value)} /></Field>
          <Field label="Docs sent"><input style={S.input} type="date" value={form.date_docs_sent} onChange={e => set('date_docs_sent', e.target.value)} /></Field>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Preliminary returned"><input style={S.input} type="date" value={form.date_preliminary_returned} onChange={e => set('date_preliminary_returned', e.target.value)} /></Field>
          <Field label="Work completed"><input style={S.input} type="date" value={form.date_completed} onChange={e => set('date_completed', e.target.value)} /></Field>
        </div>
        <Field label="Deadline"><input style={S.input} type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} /></Field>
        {error && <div style={S.error}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
          <button type="submit" style={S.btnPrimary} disabled={loading}>{loading ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  )
}

function deadlineBadge(deadline) {
  const d = parseISO(deadline)
  const days = differenceInDays(d, new Date())
  if (isPast(d) && days < 0) return { color: '#A32D2D', label: `Overdue · ${format(d, 'd MMM')}`, status: 'overdue' }
  if (days <= 14) return { color: '#854F0B', label: format(d, 'd MMM yyyy'), status: 'soon' }
  return { color: '#1D9E75', label: format(d, 'd MMM yyyy'), status: 'ok' }
}

function Field({ label, children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
    <label style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>{label}</label>
    {children}
  </div>
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: '11px', fontWeight: '500', color: '#B8952A', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '0.5px solid #F0E8D0', paddingBottom: '4px' }}>{children}</div>
}

const S = {
  btn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 13px', border: '0.5px solid #D0CEC6', borderRadius: '8px', background: 'transparent', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', color: '#444' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 13px', background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  btnSec: { padding: '8px 18px', background: 'transparent', color: '#666', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' },
  iconBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px', border: '0.5px solid #E0DED6', borderRadius: '6px', background: 'transparent', cursor: 'pointer', color: '#666' },
  badge: { display: 'inline-block', padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: '500' },
  card: { background: '#fff', border: '0.5px solid #ECEAE4', borderRadius: '12px', padding: '14px 16px' },
  emptyCard: { fontSize: '12px', color: '#ccc', padding: '12px 0', textAlign: 'center' },
  fileRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', marginBottom: '3px', border: '0.5px solid #ECEAE4', background: 'transparent', transition: 'background 0.1s' },
  memberCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', border: '0.5px solid #ECEAE4', borderRadius: '10px', background: '#fff' },
  input: { padding: '8px 10px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '100%', boxSizing: 'border-box' },
  error: { background: '#FAECE7', color: '#993C1D', fontSize: '13px', padding: '10px 12px', borderRadius: '8px' }
}
