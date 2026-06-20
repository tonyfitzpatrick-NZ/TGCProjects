import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { STAGES, TASK_STATUSES, TASK_STATUS_COLORS } from '../lib/constants'
import { Plus, AlertTriangle, Clock, ChevronDown, ChevronRight, Link2, Trash2 } from 'lucide-react'
import { format, isPast, differenceInDays, parseISO } from 'date-fns'
import { Modal } from './NewProjectModal'

export default function TasksPanel({ projectId, isLead }) {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [groupBy, setGroupBy] = useState('stage')
  const [collapsed, setCollapsed] = useState({})
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => { fetchAll() }, [projectId])

  async function fetchAll() {
    setLoading(true)
    const [tRes, cRes, uRes] = await Promise.all([
      supabase.from('tasks')
        .select('*, assigned_company:companies(id,name), assigned_user:profiles!tasks_assigned_user_id_fkey(id,full_name,avatar_initials)')
        .eq('project_id', projectId)
        .order('created_at'),
      supabase.from('companies').select('id,name,discipline').order('name'),
      supabase.from('profiles').select('id,full_name,avatar_initials,company_id').order('full_name')
    ])
    if (tRes.error) {
      console.error('fetchAll tasks error:', tRes.error)
      setFetchError(`Tasks query failed: ${tRes.error.message}${tRes.error.hint ? ' — Hint: ' + tRes.error.hint : ''}${tRes.error.details ? ' — Details: ' + tRes.error.details : ''}${tRes.error.code ? ' (code ' + tRes.error.code + ')' : ''}`)
    } else {
      setFetchError(null)
    }
    if (cRes.error) console.error('fetchAll companies error:', cRes.error)
    if (uRes.error) console.error('fetchAll users error:', uRes.error)

    const rawTasks = tRes.data || []

    // Resolve "depends_on" -> task title/status without an embedded
    // self-join (PostgREST self-referencing joins on a table with
    // multiple FKs to itself can be ambiguous and fail the whole
    // query silently). Most dependencies point to another task in
    // this same project, so we can resolve from what we already have;
    // for any that don't, fetch just those few rows separately.
    const byId = {}
    rawTasks.forEach(t => { byId[t.id] = t })
    const missingIds = [...new Set(
      rawTasks.map(t => t.depends_on).filter(id => id && !byId[id])
    )]
    if (missingIds.length > 0) {
      const { data: extra, error: extraErr } = await supabase
        .from('tasks').select('id,title,status').in('id', missingIds)
      if (extraErr) console.error('fetchAll depends_on lookup error:', extraErr)
      ;(extra || []).forEach(t => { byId[t.id] = t })
    }
    const tasksWithDeps = rawTasks.map(t => ({
      ...t,
      depends_on_task: t.depends_on ? byId[t.depends_on] || null : null
    }))

    setTasks(tasksWithDeps)
    setCompanies(cRes.data || [])
    setUsers(uRes.data || [])
    setLoading(false)
  }

  async function updateStatus(taskId, status) {
    await supabase.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', taskId)
    fetchAll()
  }

  async function deleteTask(taskId) {
    if (!window.confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', taskId)
    fetchAll()
  }

  function groupTasks() {
    if (groupBy === 'stage') {
      const map = {}
      STAGES.forEach(s => { map[s] = [] })
      map['No stage'] = []
      tasks.forEach(t => { const k = t.stage || 'No stage'; if (!map[k]) map[k] = []; map[k].push(t) })
      return Object.entries(map).filter(([, v]) => v.length > 0)
    }
    if (groupBy === 'status') {
      const map = {}
      TASK_STATUSES.forEach(s => { map[s] = [] })
      tasks.forEach(t => { const k = t.status || 'Open'; map[k].push(t) })
      return Object.entries(map).filter(([, v]) => v.length > 0)
    }
    if (groupBy === 'company') {
      const map = {}
      tasks.forEach(t => { const k = t.assigned_company?.name || 'Unassigned'; if (!map[k]) map[k] = []; map[k].push(t) })
      return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
    }
    return [['All tasks', tasks]]
  }

  const groups = groupTasks()
  const completedCount = tasks.filter(t => t.status === 'Completed').length

  if (loading) return <div style={{ color: '#aaa', fontSize: '13px', padding: '20px' }}>Loading tasks…</div>

  return (
    <div>
      {fetchError && (
        <div style={{
          background: '#FAECE7', color: '#993C1D', fontSize: '12px',
          padding: '10px 12px', borderRadius: '8px', marginBottom: '14px',
          fontFamily: 'monospace', lineHeight: '1.6', wordBreak: 'break-word'
        }}>
          {fetchError}
        </div>
      )}
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <div style={{ fontSize: '13px', color: '#aaa', flex: 1 }}>
          {completedCount}/{tasks.length} completed
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['stage','status','company'].map(g => (
            <button key={g} onClick={() => setGroupBy(g)} style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
              border: '0.5px solid #D0CEC6', background: groupBy === g ? '#1B2B4B' : 'transparent',
              color: groupBy === g ? '#fff' : '#666'
            }}>{g.charAt(0).toUpperCase() + g.slice(1)}</button>
          ))}
        </div>
        {isLead && (
          <button onClick={() => setShowNew(true)} style={S.addBtn}><Plus size={12} /> Add task</button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#ccc', padding: '30px', fontSize: '13px' }}>
          No tasks yet.{isLead ? ' Click "Add task" to create the first one.' : ''}
        </div>
      ) : (
        groups.map(([groupName, groupTasks]) => (
          <div key={groupName} style={{ marginBottom: '16px' }}>
            <div onClick={() => setCollapsed(c => ({ ...c, [groupName]: !c[groupName] }))}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0', cursor: 'pointer', marginBottom: '6px' }}>
              {collapsed[groupName] ? <ChevronRight size={13} color="#aaa" /> : <ChevronDown size={13} color="#aaa" />}
              <span style={{ fontSize: '12px', fontWeight: '500', color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{groupName}</span>
              <span style={{ fontSize: '11px', color: '#bbb' }}>({groupTasks.length})</span>
            </div>
            {!collapsed[groupName] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {groupTasks.map(task => (
                  <TaskRow key={task.id} task={task} isLead={isLead} profile={profile}
                    onStatusChange={updateStatus}
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => deleteTask(task.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {showNew && <TaskModal projectId={projectId} companies={companies} users={users} tasks={tasks} onClose={() => setShowNew(false)} onSaved={fetchAll} />}
      {editingTask && <TaskModal projectId={projectId} task={editingTask} companies={companies} users={users} tasks={tasks.filter(t => t.id !== editingTask.id)} onClose={() => setEditingTask(null)} onSaved={fetchAll} />}
    </div>
  )
}

function TaskRow({ task, isLead, profile, onStatusChange, onEdit, onDelete }) {
  const tc = TASK_STATUS_COLORS[task.status] || TASK_STATUS_COLORS['Open']
  const dep = task.depends_on_task
  const depBlocked = dep && dep.status !== 'Completed'
  const isMyTask = task.assigned_user?.id === profile?.id

  function deadlineBadge() {
    if (!task.deadline) return null
    const d = parseISO(task.deadline)
    const days = differenceInDays(d, new Date())
    if (isPast(d) && days < 0) return { color: '#A32D2D', label: `Overdue · ${format(d, 'd MMM')}`, icon: AlertTriangle }
    if (days <= 7) return { color: '#854F0B', label: `Due ${format(d, 'd MMM')}`, icon: Clock }
    return { color: '#aaa', label: format(d, 'd MMM'), icon: null }
  }

  const dl = deadlineBadge()

  return (
    <div style={{
      border: `0.5px solid ${depBlocked ? '#F4C0D1' : '#ECEAE4'}`,
      borderRadius: '8px', padding: '10px 12px', background: depBlocked ? '#FFF8F8' : '#fff',
      display: 'flex', alignItems: 'flex-start', gap: '10px'
    }}>
      {/* Status selector */}
      <select value={task.status} onChange={e => onStatusChange(task.id, e.target.value)}
        style={{ padding: '2px 6px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', border: 'none', cursor: 'pointer', background: tc.bg, color: tc.color, fontFamily: 'inherit', flexShrink: 0, marginTop: '1px' }}>
        {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
      </select>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: '500', color: task.status === 'Completed' ? '#aaa' : '#1a1a1a', textDecoration: task.status === 'Completed' ? 'line-through' : 'none' }}>
            {task.title}
          </span>
          {isMyTask && <span style={{ fontSize: '10px', background: '#EEEDFE', color: '#534AB7', padding: '1px 6px', borderRadius: '10px', fontWeight: '500' }}>Assigned to me</span>}
          {depBlocked && (
            <span style={{ fontSize: '10px', background: '#FAECE7', color: '#993C1D', padding: '1px 6px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Link2 size={9} /> Blocked by: {dep.title}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
          {task.assigned_company && <span style={{ fontSize: '11px', color: '#888' }}>{task.assigned_company.name}</span>}
          {task.assigned_user && <span style={{ fontSize: '11px', color: '#888' }}>→ {task.assigned_user.full_name}</span>}
          {task.stage && <span style={{ fontSize: '11px', color: '#bbb' }}>{task.stage}</span>}
          {task.hours_allowed && <span style={{ fontSize: '11px', color: '#bbb' }}>{task.hours_allowed}h</span>}
          {dl && (
            <span style={{ fontSize: '11px', color: dl.color, display: 'flex', alignItems: 'center', gap: '3px' }}>
              {dl.icon && <dl.icon size={10} />}{dl.label}
            </span>
          )}
        </div>
        {task.description && <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>{task.description}</div>}
      </div>

      {isLead && (
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button onClick={onEdit} style={S.iconBtn} title="Edit">✎</button>
          <button onClick={onDelete} style={{ ...S.iconBtn, color: '#ddd' }} title="Delete"><Trash2 size={11} /></button>
        </div>
      )}
    </div>
  )
}

function TaskModal({ projectId, task, companies, users, tasks, onClose, onSaved }) {
  const { profile } = useAuth()
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'Open',
    stage: task?.stage || '',
    assigned_company_id: task?.assigned_company_id || '',
    assigned_user_id: task?.assigned_user_id || '',
    deadline: task?.deadline || '',
    hours_allowed: task?.hours_allowed || '',
    depends_on: task?.depends_on || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const companyUsers = form.assigned_company_id
    ? users.filter(u => u.company_id === form.assigned_company_id)
    : users

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title) { setError('Task title is required.'); return }
    setLoading(true); setError('')
    const payload = {
      project_id: projectId,
      title: form.title, description: form.description || null,
      status: form.status, stage: form.stage || null,
      assigned_company_id: form.assigned_company_id || null,
      assigned_user_id: form.assigned_user_id || null,
      deadline: form.deadline || null,
      hours_allowed: form.hours_allowed ? Number(form.hours_allowed) : null,
      depends_on: form.depends_on || null,
      updated_at: new Date().toISOString()
    }
    let err
    if (task) {
      ({ error: err } = await supabase.from('tasks').update(payload).eq('id', task.id))
    } else {
      payload.created_by = profile?.id
      ;({ error: err } = await supabase.from('tasks').insert(payload))
    }
    if (err) { setError(err.message); setLoading(false); return }
    onSaved(); onClose()
  }

  return (
    <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Field label="Task title *">
          <input style={S.input} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Prepare structural calculation report" required />
        </Field>
        <Field label="Description">
          <textarea style={{ ...S.input, minHeight: '60px', resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} />
        </Field>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Status">
            <select style={S.input} value={form.status} onChange={e => set('status', e.target.value)}>
              {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Project stage">
            <select style={S.input} value={form.stage} onChange={e => set('stage', e.target.value)}>
              <option value="">Any stage</option>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Assign to company">
            <select style={S.input} value={form.assigned_company_id} onChange={e => { set('assigned_company_id', e.target.value); set('assigned_user_id', '') }}>
              <option value="">Unassigned</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Assign to user">
            <select style={S.input} value={form.assigned_user_id} onChange={e => set('assigned_user_id', e.target.value)}>
              <option value="">Company to assign</option>
              {companyUsers.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Field label="Deadline">
            <input style={S.input} type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
          </Field>
          <Field label="Hours allowed">
            <input style={S.input} type="number" min="0" step="0.5" value={form.hours_allowed} onChange={e => set('hours_allowed', e.target.value)} placeholder="e.g. 8" />
          </Field>
        </div>
        <Field label="Depends on (flag only — task must be completed first)">
          <select style={S.input} value={form.depends_on} onChange={e => set('depends_on', e.target.value)}>
            <option value="">No dependency</option>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </Field>
        {error && <div style={S.error}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={S.btnSec}>Cancel</button>
          <button type="submit" style={S.btnPrimary} disabled={loading}>{loading ? 'Saving…' : task ? 'Save changes' : 'Create task'}</button>
        </div>
      </form>
    </Modal>
  )
}

function Field({ label, children }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
    <label style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>{label}</label>
    {children}
  </div>
}

const S = {
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', border: '0.5px solid #D0CEC6', borderRadius: '6px', background: 'transparent', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', color: '#444' },
  iconBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#999', fontSize: '13px' },
  input: { padding: '8px 10px', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', outline: 'none', background: '#FAFAF8', fontFamily: 'inherit', color: '#1a1a1a', width: '100%', boxSizing: 'border-box' },
  error: { background: '#FAECE7', color: '#993C1D', fontSize: '13px', padding: '10px 12px', borderRadius: '8px' },
  btnPrimary: { padding: '8px 18px', background: '#1B2B4B', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' },
  btnSec: { padding: '8px 18px', background: 'transparent', color: '#666', border: '0.5px solid #D0CEC6', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }
}
